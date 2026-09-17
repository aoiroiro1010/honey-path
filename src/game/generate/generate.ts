import type { Board } from "../model/board";
import type { Cell } from "../model/cell";
import { COLORS, type Color } from "../model/color";
import { dirBetween, hexDistance } from "../model/hex";
import { type Difficulty, difficultyForTier } from "./difficulty";
import { createRng, rngInt, rngShuffle } from "./rng";
import { axialFromKey, axialKey, hexDisk, neighborKeys } from "./shape";
import { createUniquenessChecker } from "./uniqueness";

type Coord = { x: number; y: number };
type Path = { color: Color; coords: Coord[] };

const MAX_ATTEMPTS = 80;
const PATH_ATTEMPTS = 20;

type CarveGraph = {
	n: number;
	keys: string[];
	coords: Coord[];
	neighbors: number[][];
	alive: Uint8Array;
	seen: Uint8Array;
	stamp: number;
	stack: number[];
	aliveCount: number;
};

function buildCarveGraph(cellKeys: string[]): CarveGraph {
	const n = cellKeys.length;
	const keyIndex = new Map(cellKeys.map((k, i) => [k, i]));
	const coords = cellKeys.map(axialFromKey);
	const neighbors: number[][] = Array.from({ length: n }, () => []);
	for (let i = 0; i < n; i++) {
		const { x, y } = coords[i];
		for (const nk of neighborKeys(x, y)) {
			const j = keyIndex.get(nk);
			if (j !== undefined) {
				neighbors[i].push(j);
			}
		}
	}
	return {
		n,
		keys: cellKeys,
		coords,
		neighbors,
		alive: new Uint8Array(n).fill(1),
		seen: new Uint8Array(n),
		stamp: 1,
		stack: [],
		aliveCount: n,
	};
}

function carveConnected(g: CarveGraph): boolean {
	if (g.aliveCount <= 1) {
		return true;
	}
	g.stamp = (g.stamp + 1) & 255;
	if (g.stamp === 0) {
		g.seen.fill(0);
		g.stamp = 1;
	}
	const stamp = g.stamp;
	let start = -1;
	for (let i = 0; i < g.n; i++) {
		if (g.alive[i]) {
			start = i;
			break;
		}
	}
	if (start < 0) {
		return true;
	}
	const stack = g.stack;
	stack.length = 0;
	stack.push(start);
	g.seen[start] = stamp;
	let found = 0;
	while (stack.length > 0) {
		const i = stack.pop() as number;
		found += 1;
		for (const j of g.neighbors[i]) {
			if (g.alive[j] && g.seen[j] !== stamp) {
				g.seen[j] = stamp;
				stack.push(j);
			}
		}
	}
	return found === g.aliveCount;
}

function degreeAlive(g: CarveGraph, i: number): number {
	let d = 0;
	for (const j of g.neighbors[i]) {
		if (g.alive[j]) {
			d += 1;
		}
	}
	return d;
}

/** 残りが連結なまま進む経路（大きい盤で分断しない） */
function growPathIndexed(
	g: CarveGraph,
	start: number,
	rng: () => number,
	maxLength: number,
): number[] {
	const path = [start];
	g.alive[start] = 0;
	g.aliveCount -= 1;

	while (path.length < maxLength) {
		const tip = path[path.length - 1];
		let options: number[] = [];
		for (const j of g.neighbors[tip]) {
			if (g.alive[j]) {
				options.push(j);
			}
		}
		if (options.length === 0) {
			break;
		}

		if (options.length > 1 && g.aliveCount > 8) {
			const safe: number[] = [];
			for (const j of options) {
				g.alive[j] = 0;
				g.aliveCount -= 1;
				if (carveConnected(g)) {
					safe.push(j);
				}
				g.alive[j] = 1;
				g.aliveCount += 1;
			}
			if (safe.length > 0) {
				options = safe;
			}
		}

		const prev = path.length >= 2 ? path[path.length - 2] : -1;
		let best = options[0];
		let bestScore = -1;
		for (const j of options) {
			let bend = 0;
			if (prev >= 0) {
				const tipC = g.coords[tip];
				const prevC = g.coords[prev];
				const nextC = g.coords[j];
				const d1 = dirBetween(tipC, prevC);
				const d2 = dirBetween(tipC, nextC);
				if (d1 && d2 && d1 !== d2) {
					bend = 1;
				}
			}
			const score = bend * 2 + rng();
			if (score > bestScore) {
				bestScore = score;
				best = j;
			}
		}
		path.push(best);
		g.alive[best] = 0;
		g.aliveCount -= 1;
	}

	return path;
}

function coverRemainingIndexed(
	g: CarveGraph,
	rng: () => number,
): number[] | null {
	if (g.aliveCount < 2) {
		return null;
	}
	const candidates: number[] = [];
	for (let i = 0; i < g.n; i++) {
		if (g.alive[i]) {
			candidates.push(i);
		}
	}
	const savedAlive = Uint8Array.from(g.alive);
	const savedCount = g.aliveCount;

	for (let attempt = 0; attempt < 16; attempt++) {
		g.alive.set(savedAlive);
		g.aliveCount = savedCount;
		const start = candidates[rngInt(rng, candidates.length)];
		const path = [start];
		g.alive[start] = 0;
		g.aliveCount -= 1;
		let stuck = false;
		while (g.aliveCount > 0) {
			const tip = path[path.length - 1];
			const options: number[] = [];
			for (const j of g.neighbors[tip]) {
				if (g.alive[j]) {
					options.push(j);
				}
			}
			if (options.length === 0) {
				stuck = true;
				break;
			}
			let best = options[0];
			let bestDeg = degreeAlive(g, best);
			for (let k = 1; k < options.length; k++) {
				const j = options[k];
				const d = degreeAlive(g, j);
				if (d < bestDeg || (d === bestDeg && rng() < 0.3)) {
					best = j;
					bestDeg = d;
				}
			}
			path.push(best);
			g.alive[best] = 0;
			g.aliveCount -= 1;
		}
		if (!stuck) {
			return path;
		}
	}
	g.alive.set(savedAlive);
	g.aliveCount = savedCount;
	return null;
}

/** 色ごとに別経路で全マスを分割する（1本パスの切断はしない） */
function carveSeparatePaths(
	cellKeys: string[],
	colorCount: number,
	rng: () => number,
): Path[] | null {
	const colors = COLORS.slice(0, colorCount);
	if (cellKeys.length < colorCount * 2) {
		return null;
	}

	const g = buildCarveGraph(cellKeys);
	const paths: Path[] = [];

	for (let i = 0; i < colors.length; i++) {
		const color = colors[i];
		const left = g.aliveCount;
		const colorsLeft = colors.length - i;
		if (left === 0) {
			return null;
		}

		const isLast = i === colors.length - 1;
		if (isLast) {
			const idxs = coverRemainingIndexed(g, rng);
			if (!idxs) {
				return null;
			}
			paths.push({
				color,
				coords: idxs.map((idx) => g.coords[idx]),
			});
			break;
		}

		const target = Math.max(2, Math.floor(left / colorsLeft));
		const aliveIdx: number[] = [];
		for (let k = 0; k < g.n; k++) {
			if (g.alive[k]) {
				aliveIdx.push(k);
			}
		}
		const start = aliveIdx[rngInt(rng, aliveIdx.length)];
		const idxs = growPathIndexed(g, start, rng, target);

		if (idxs.length < 2 || !carveConnected(g)) {
			return null;
		}

		paths.push({
			color,
			coords: idxs.map((idx) => g.coords[idx]),
		});
	}

	return paths;
}

/** 2線分が端点以外で交差するか（axial を平面座標とみなす） */
function segmentsCross(a0: Coord, a1: Coord, b0: Coord, b1: Coord): boolean {
	const ends = new Set([
		axialKey(a0.x, a0.y),
		axialKey(a1.x, a1.y),
		axialKey(b0.x, b0.y),
		axialKey(b1.x, b1.y),
	]);
	if (ends.size < 4) {
		return false;
	}

	function orient(p: Coord, q: Coord, r: Coord): number {
		return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
	}

	function onSeg(p: Coord, q: Coord, r: Coord): boolean {
		return (
			Math.min(p.x, r.x) <= q.x &&
			q.x <= Math.max(p.x, r.x) &&
			Math.min(p.y, r.y) <= q.y &&
			q.y <= Math.max(p.y, r.y)
		);
	}

	const o1 = orient(a0, a1, b0);
	const o2 = orient(a0, a1, b1);
	const o3 = orient(b0, b1, a0);
	const o4 = orient(b0, b1, a1);

	if (o1 === 0 && onSeg(a0, b0, a1)) {
		return true;
	}
	if (o2 === 0 && onSeg(a0, b1, a1)) {
		return true;
	}
	if (o3 === 0 && onSeg(b0, a0, b1)) {
		return true;
	}
	if (o4 === 0 && onSeg(b0, a1, b1)) {
		return true;
	}

	return o1 * o2 < 0 && o3 * o4 < 0;
}

function scorePathSet(paths: Path[]): number {
	let crosses = 0;
	for (let i = 0; i < paths.length; i++) {
		const a0 = paths[i].coords[0];
		const a1 = paths[i].coords[paths[i].coords.length - 1];
		for (let j = i + 1; j < paths.length; j++) {
			const b0 = paths[j].coords[0];
			const b1 = paths[j].coords[paths[j].coords.length - 1];
			if (segmentsCross(a0, a1, b0, b1)) {
				crosses += 1;
			}
		}
	}

	const owner = new Map<string, Color>();
	for (const path of paths) {
		for (const coord of path.coords) {
			owner.set(axialKey(coord.x, coord.y), path.color);
		}
	}

	let boundary = 0;
	let bends = 0;
	for (const path of paths) {
		for (let i = 1; i < path.coords.length - 1; i++) {
			const prev = path.coords[i - 1];
			const curr = path.coords[i];
			const next = path.coords[i + 1];
			const a = dirBetween(curr, prev);
			const b = dirBetween(curr, next);
			if (a && b && a !== b) {
				bends += 1;
			}
			for (const key of neighborKeys(curr.x, curr.y)) {
				const other = owner.get(key);
				if (other && other !== path.color) {
					boundary += 1;
				}
			}
		}
		const start = path.coords[0];
		const goal = path.coords[path.coords.length - 1];
		// 近い S/G なのにパスが長い＝遠回り
		const detour = path.coords.length - 1 - hexDistance(start, goal);
		bends += Math.max(0, detour);
	}

	return crosses * 20 + boundary + bends;
}

function pickBestPaths(
	cellKeys: string[],
	colorCount: number,
	rng: () => number,
): Path[] | null {
	let best: Path[] | null = null;
	let bestScore = -1;
	const goodEnough = colorCount * 35;

	for (let attempt = 0; attempt < PATH_ATTEMPTS; attempt++) {
		const paths = carveSeparatePaths(cellKeys, colorCount, rng);
		if (!paths) {
			continue;
		}
		const score = scorePathSet(paths);
		if (score > bestScore) {
			bestScore = score;
			best = paths;
			if (bestScore >= goodEnough && attempt >= 4) {
				break;
			}
		}
	}

	return best;
}

function removeHoles(
	cells: Cell[],
	holeCount: number,
	rng: () => number,
): Cell[] {
	if (holeCount <= 0 || cells.length <= holeCount + 4) {
		return cells;
	}
	const candidates = rngShuffle(rng, cells);
	const remove = new Set(
		candidates.slice(0, holeCount).map((cell) => axialKey(cell.x, cell.y)),
	);
	return cells.filter((cell) => !remove.has(axialKey(cell.x, cell.y)));
}

function applyEndpoints(cells: Cell[], paths: Path[]): Cell[] {
	const byKey = new Map(
		cells.map((cell) => [axialKey(cell.x, cell.y), { ...cell }]),
	);

	for (const path of paths) {
		const start = path.coords[0];
		const goal = path.coords[path.coords.length - 1];
		const startCell = byKey.get(axialKey(start.x, start.y));
		const goalCell = byKey.get(axialKey(goal.x, goal.y));
		if (startCell) {
			startCell.start = { color: path.color };
		}
		if (goalCell) {
			goalCell.goal = { color: path.color };
		}
	}

	return [...byKey.values()];
}

/** 正解パス上の空きマス（端点以外）すべてに向きを載せる */
function applyAllDirs(cells: Cell[], paths: Path[]): Cell[] {
	const byKey = new Map(
		cells.map((cell) => [axialKey(cell.x, cell.y), { ...cell }]),
	);

	for (const path of paths) {
		for (let i = 1; i < path.coords.length - 1; i++) {
			const prev = path.coords[i - 1];
			const curr = path.coords[i];
			const next = path.coords[i + 1];
			const a = dirBetween(curr, prev);
			const b = dirBetween(curr, next);
			if (!a || !b) {
				continue;
			}
			const cell = byKey.get(axialKey(curr.x, curr.y));
			if (!cell || cell.start || cell.goal) {
				continue;
			}
			cell.dirs = { a, b };
		}
	}

	return [...byKey.values()];
}

/**
 * 向きを減らしていき、別解が出ないギリギリまで残す。
 * 削除順を変えて探索し、より少ない向きを採用する。
 */
function stripDirsToUnique(
	board: Board,
	paths: Path[],
	rng: () => number,
): Board {
	const fullDirs = new Map<string, NonNullable<Cell["dirs"]>>();
	for (const cell of board.cells) {
		if (cell.dirs) {
			fullDirs.set(axialKey(cell.x, cell.y), { ...cell.dirs });
		}
	}
	if (fullDirs.size === 0) {
		return board;
	}

	const intended = paths.map((path) => ({
		color: path.color,
		coords: path.coords,
	}));
	const checker = createUniquenessChecker(board, intended);
	const { dirIndices } = checker;
	if (dirIndices.length === 0) {
		return board;
	}

	const cache = new Map<bigint, boolean>();
	const deadline = Date.now() + Math.min(420, 180 + dirIndices.length * 3);

	function timeUp() {
		return Date.now() >= deadline;
	}

	/** 別解あり、または探索未完了なら不可（削りすぎ防止） */
	function allows(): boolean {
		if (timeUp()) {
			return false;
		}
		const bits = checker.bits;
		const hit = cache.get(bits);
		if (hit !== undefined) {
			return hit;
		}
		let pop = 0;
		let x = bits;
		while (x > 0n) {
			pop += 1;
			x &= x - 1n;
		}
		const budget =
			pop > 40 ? 12_000 : pop > 25 ? 20_000 : pop > 15 ? 32_000 : 48_000;
		const { unique } = checker.isUnique(budget, deadline);
		cache.set(bits, unique);
		return unique;
	}

	// start full
	checker.setKeptIndices(dirIndices);
	if (!allows()) {
		return board;
	}

	function stripChunk(indices: number[]) {
		if (indices.length === 0 || timeUp()) {
			return;
		}
		const snapshot = checker.bits;
		for (const i of indices) {
			checker.setDirBit(i, false);
		}
		if (allows()) {
			return;
		}
		checker.restoreBits(snapshot);
		if (indices.length === 1 || timeUp()) {
			return;
		}
		const mid = indices.length >> 1;
		stripChunk(indices.slice(0, mid));
		stripChunk(indices.slice(mid));
	}

	function greedyPolish() {
		let progress = true;
		let rounds = 0;
		while (progress && rounds < 2 && !timeUp()) {
			rounds += 1;
			progress = false;
			for (const i of rngShuffle(rng, dirIndices)) {
				if (timeUp()) {
					return;
				}
				if (!checker.flat.hasDirs[i]) {
					continue;
				}
				const prev = checker.clearDirBit(i);
				if (allows()) {
					progress = true;
				} else {
					checker.restoreBits(prev);
				}
			}
		}
	}

	let bestBits = checker.bits;
	let bestPop = dirIndices.length;

	function popcount(bits: bigint): number {
		let n = 0;
		let x = bits;
		while (x > 0n) {
			n += 1;
			x &= x - 1n;
		}
		return n;
	}

	for (let r = 0; r < 2 && !timeUp(); r++) {
		checker.setKeptIndices(dirIndices);
		const order = rngShuffle(rng, dirIndices);
		const chunkSize = Math.max(5, Math.ceil(order.length / 5));
		for (let i = 0; i < order.length && !timeUp(); i += chunkSize) {
			stripChunk(order.slice(i, i + chunkSize));
		}
		greedyPolish();

		const on: number[] = [];
		for (const i of dirIndices) {
			if (checker.flat.hasDirs[i]) {
				on.push(i);
			}
		}
		if (on.length >= 2 && !timeUp()) {
			const a = on[rngInt(rng, on.length)];
			const b = on[rngInt(rng, on.length)];
			if (a !== b) {
				const snap = checker.bits;
				checker.setDirBit(a, false);
				checker.setDirBit(b, false);
				if (allows()) {
					greedyPolish();
				} else {
					checker.restoreBits(snap);
				}
			}
		}

		const pop = popcount(checker.bits);
		if (pop < bestPop) {
			bestPop = pop;
			bestBits = checker.bits;
		}
	}

	checker.restoreBits(bestBits);
	// 削り中に一意確認済み。最終は別解の有無だけ低予算で見て、あれば足す。
	{
		const { alternate } = checker.isUnique(20_000);
		if (alternate) {
			for (const i of rngShuffle(rng, dirIndices)) {
				if (checker.flat.hasDirs[i]) {
					continue;
				}
				checker.setDirBit(i, true);
				if (!checker.isUnique(20_000).alternate) {
					break;
				}
			}
		}
	}

	const keptKeys = new Set<string>();
	for (const i of dirIndices) {
		if (checker.flat.hasDirs[i]) {
			keptKeys.add(checker.flat.keys[i]);
		}
	}

	return {
		cells: board.cells.map((cell) => {
			const next = { ...cell };
			const key = axialKey(cell.x, cell.y);
			const dirs = fullDirs.get(key);
			if (keptKeys.has(key) && dirs) {
				next.dirs = { ...dirs };
			} else {
				delete next.dirs;
			}
			return next;
		}),
		lines: board.lines,
	};
}

function applyNumbers(
	cells: Cell[],
	paths: Path[],
	numbersPerColor: number,
): Cell[] {
	if (numbersPerColor <= 0) {
		return cells;
	}

	const byKey = new Map(
		cells.map((cell) => [axialKey(cell.x, cell.y), { ...cell }]),
	);

	for (const path of paths) {
		const start = path.coords[0];
		const internals = path.coords.slice(1, -1);
		if (internals.length === 0) {
			continue;
		}
		const count = Math.min(numbersPerColor, internals.length);
		const ranked = internals.map((coord, i) => {
			const pathIndex = i + 1;
			const detour = pathIndex - hexDistance(start, coord);
			return { coord, pathIndex, detour };
		});
		ranked.sort((a, b) => b.detour - a.detour || b.pathIndex - a.pathIndex);
		const chosen = ranked
			.slice(0, count)
			.sort((a, b) => a.pathIndex - b.pathIndex);

		let value = 1;
		for (const item of chosen) {
			const cell = byKey.get(axialKey(item.coord.x, item.coord.y));
			if (!cell || cell.start || cell.goal || cell.dirs) {
				continue;
			}
			cell.number = { color: path.color, value };
			value += 1;
		}
	}

	return [...byKey.values()];
}

function buildBoard(
	baseCells: Cell[],
	paths: Path[],
	difficulty: Difficulty,
	rng: () => number,
): Board {
	let cells = applyEndpoints(baseCells, paths);
	// 番号は向きより先だと向き全載せと衝突するので、
	// 高難易度では numbersPerColor=0。付ける場合は向き削りの後でもよいが、
	// 仕様どおり高難易度は番号なし。
	cells = applyAllDirs(cells, paths);

	let board: Board = {
		cells,
		lines: paths.map((path) => ({ color: path.color, coords: [] })),
	};
	board = stripDirsToUnique(board, paths, rng);

	if (difficulty.numbersPerColor > 0) {
		const withNums = applyNumbers(
			board.cells,
			paths,
			difficulty.numbersPerColor,
		);
		board = { ...board, cells: withNums };
	}

	return board;
}

function tryGenerate(difficulty: Difficulty, rng: () => number): Board | null {
	let cells = hexDisk(difficulty.radius);
	cells = removeHoles(cells, difficulty.holeCount, rng);
	if (cells.length < difficulty.colorCount * 2) {
		return null;
	}

	const keys = cells.map((cell) => axialKey(cell.x, cell.y));
	const paths = pickBestPaths(keys, difficulty.colorCount, rng);
	if (!paths) {
		return null;
	}

	return buildBoard(cells, paths, difficulty, rng);
}

function fallbackBoard(seed: number): Board {
	const rng = createRng(seed ^ 0xabc);
	const cells = hexDisk(2);
	const keys = cells.map((cell) => axialKey(cell.x, cell.y));
	const paths = carveSeparatePaths(keys, 2, rng);
	if (paths) {
		return buildBoard(
			cells,
			paths,
			{ radius: 2, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
			rng,
		);
	}

	return {
		cells: [
			{ x: 0, y: 0, start: { color: "red" } },
			{ x: 1, y: 0, goal: { color: "red" } },
		],
		lines: [{ color: "red", coords: [] }],
	};
}

export function generateBoard(seed: number, tier: number): Board {
	const difficulty = difficultyForTier(tier);
	const rng = createRng(seed);

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const board = tryGenerate(difficulty, rng);
		if (board) {
			return board;
		}
	}

	return fallbackBoard(seed);
}
