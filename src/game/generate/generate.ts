import type { Board } from "../model/board";
import type { Cell } from "../model/cell";
import { COLORS, type Color } from "../model/color";
import { dirBetween, hexDistance } from "../model/hex";
import { type Difficulty, difficultyForTier } from "./difficulty";
import { createRng, rngInt, rngPick, rngShuffle } from "./rng";
import { axialFromKey, axialKey, hexDisk, neighborKeys } from "./shape";
import { countSolutions, hasAlternateSolution } from "./uniqueness";

type Coord = { x: number; y: number };
type Path = { color: Color; coords: Coord[] };

const MAX_ATTEMPTS = 200;
const PATH_ATTEMPTS = 80;

function degreeIn(key: string, remaining: Set<string>): number {
	const { x, y } = axialFromKey(key);
	return neighborKeys(x, y).filter((n) => remaining.has(n)).length;
}

function isConnected(keys: Set<string>): boolean {
	if (keys.size <= 1) {
		return true;
	}
	const start = keys.values().next().value as string;
	const seen = new Set<string>();
	const stack = [start];
	while (stack.length > 0) {
		const key = stack.pop();
		if (!key || seen.has(key)) {
			continue;
		}
		seen.add(key);
		const { x, y } = axialFromKey(key);
		for (const n of neighborKeys(x, y)) {
			if (keys.has(n) && !seen.has(n)) {
				stack.push(n);
			}
		}
	}
	return seen.size === keys.size;
}

/** 残りが連結なまま進む経路（大きい盤で分断しない） */
function growPath(
	startKey: string,
	remaining: Set<string>,
	rng: () => number,
	maxLength: number,
): string[] {
	const path = [startKey];
	remaining.delete(startKey);

	while (path.length < maxLength) {
		const tip = axialFromKey(path[path.length - 1]);
		let options = neighborKeys(tip.x, tip.y).filter((key) =>
			remaining.has(key),
		);
		if (options.length === 0) {
			break;
		}

		// 取ったあとも残りが連結なものだけ候補に（最後の1個は除く）
		const safe = options.filter((key) => {
			remaining.delete(key);
			const ok = isConnected(remaining);
			remaining.add(key);
			return ok;
		});
		if (safe.length > 0) {
			options = safe;
		}

		const prev =
			path.length >= 2 ? axialFromKey(path[path.length - 2]) : undefined;
		const scored = options.map((key) => {
			const next = axialFromKey(key);
			let bend = 0;
			if (prev) {
				const d1 = dirBetween(tip, prev);
				const d2 = dirBetween(tip, next);
				if (d1 && d2 && d1 !== d2) {
					bend = 1;
				}
			}
			return { key, score: bend * 2 + rng() };
		});
		scored.sort((a, b) => b.score - a.score);
		const next = scored[0].key;
		path.push(next);
		remaining.delete(next);
	}

	return path;
}

/** 残マスをすべて通る経路（最後の色用） */
function coverRemaining(
	cellKeys: string[],
	rng: () => number,
): string[] | null {
	if (cellKeys.length < 2) {
		return null;
	}
	for (let attempt = 0; attempt < 24; attempt++) {
		const start = rngPick(rng, cellKeys);
		const remaining = new Set(cellKeys);
		remaining.delete(start);
		const path = [start];
		let stuck = false;
		while (remaining.size > 0) {
			const tip = axialFromKey(path[path.length - 1]);
			const options = rngShuffle(
				rng,
				neighborKeys(tip.x, tip.y).filter((key) => remaining.has(key)),
			);
			if (options.length === 0) {
				stuck = true;
				break;
			}
			options.sort((a, b) => degreeIn(a, remaining) - degreeIn(b, remaining));
			const next = options[0];
			path.push(next);
			remaining.delete(next);
		}
		if (!stuck && path.length === cellKeys.length) {
			return path;
		}
	}
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

	const remaining = new Set(cellKeys);
	const paths: Path[] = [];

	for (let i = 0; i < colors.length; i++) {
		const color = colors[i];
		const left = remaining.size;
		const colorsLeft = colors.length - i;
		if (left === 0) {
			return null;
		}

		const isLast = i === colors.length - 1;
		if (isLast) {
			const keys = coverRemaining([...remaining], rng);
			if (!keys) {
				return null;
			}
			remaining.clear();
			paths.push({
				color,
				coords: keys.map(axialFromKey),
			});
			break;
		}

		const target = Math.max(2, Math.floor(left / colorsLeft));
		const start = rngPick(rng, [...remaining]);
		const keys = growPath(start, remaining, rng, target);

		if (keys.length < 2 || !isConnected(remaining)) {
			return null;
		}

		paths.push({
			color,
			coords: keys.map(axialFromKey),
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

	for (let attempt = 0; attempt < PATH_ATTEMPTS; attempt++) {
		const paths = carveSeparatePaths(cellKeys, colorCount, rng);
		if (!paths) {
			continue;
		}
		const score = scorePathSet(paths);
		if (score > bestScore) {
			bestScore = score;
			best = paths;
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
 * 削除順・追加順・キックを変えて探索し、より少ない向きを採用する。
 * 残数の多少は問わず、足りなくても盤を捨てない。
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

	const allKeys = [...fullDirs.keys()];
	if (allKeys.length === 0) {
		return board;
	}

	const intended = paths.map((path) => ({
		color: path.color,
		coords: path.coords,
	}));

	function makeBoard(kept: Set<string>): Board {
		return {
			cells: board.cells.map((cell) => {
				const key = axialKey(cell.x, cell.y);
				const next = { ...cell };
				const dirs = fullDirs.get(key);
				if (kept.has(key) && dirs) {
					next.dirs = { ...dirs };
				} else {
					delete next.dirs;
				}
				return next;
			}),
			lines: board.lines,
		};
	}

	function signature(kept: Set<string>): string {
		let out = "";
		for (const key of allKeys) {
			out += kept.has(key) ? "1" : "0";
		}
		return out;
	}

	const cache = new Map<string, boolean>();
	/**
	 * 別解が見つかったら不可。
	 * 探索が尽きて別解なしなら可。打ち切りで未確認なら不可（削りすぎ防止）。
	 */
	function allowsStrip(kept: Set<string>): boolean {
		const sig = signature(kept);
		const hit = cache.get(sig);
		if (hit !== undefined) {
			return hit;
		}
		const board = makeBoard(kept);
		const alt = hasAlternateSolution(board, intended, 100_000);
		if (alt.alternate) {
			cache.set(sig, false);
			return false;
		}
		if (alt.exhausted) {
			cache.set(sig, true);
			return true;
		}
		const counted = countSolutions(board, 2, 120_000);
		if (counted.count >= 2) {
			cache.set(sig, false);
			return false;
		}
		if (counted.count === 1 && counted.exhausted) {
			cache.set(sig, true);
			return true;
		}
		// 未確認: 削らない
		cache.set(sig, false);
		return false;
	}

	const fullKept = new Set(allKeys);
	if (!allowsStrip(fullKept)) {
		return makeBoard(fullKept);
	}

	const deadline = Date.now() + Math.min(18_000, 3_500 + allKeys.length * 150);
	const STRIP_RESTARTS = 5;
	const ADD_RESTARTS = 3;
	const KICK_ROUNDS = 4;
	const PAIR_TRIES = Math.min(40, allKeys.length * 3);

	let bestKept = new Set(allKeys);

	function consider(kept: Set<string>) {
		if (kept.size < bestKept.size) {
			bestKept = new Set(kept);
		}
	}

	function timeUp() {
		return Date.now() >= deadline;
	}

	function greedyStrip(initial: Set<string>): Set<string> {
		const kept = new Set(initial);
		let progress = true;
		while (progress && !timeUp()) {
			progress = false;
			for (const key of rngShuffle(rng, [...kept])) {
				if (timeUp()) {
					break;
				}
				kept.delete(key);
				if (allowsStrip(kept)) {
					progress = true;
				} else {
					kept.add(key);
				}
			}
		}
		return kept;
	}

	function tryPairs(kept: Set<string>): Set<string> {
		let pairProgress = true;
		let pairRounds = 0;
		while (pairProgress && pairRounds < 4 && !timeUp()) {
			pairRounds += 1;
			pairProgress = false;
			for (let t = 0; t < PAIR_TRIES; t++) {
				if (timeUp()) {
					return kept;
				}
				const list = [...kept];
				if (list.length < 2) {
					return kept;
				}
				const i = rngInt(rng, list.length);
				let j = rngInt(rng, list.length - 1);
				if (j >= i) {
					j += 1;
				}
				const a = list[i];
				const b = list[j];
				kept.delete(a);
				kept.delete(b);
				if (allowsStrip(kept)) {
					pairProgress = true;
					break;
				}
				kept.add(a);
				kept.add(b);
			}
		}
		return kept;
	}

	function repairNoAlternate(kept: Set<string>): Set<string> {
		for (const key of rngShuffle(rng, allKeys)) {
			if (allowsStrip(kept)) {
				return kept;
			}
			kept.add(key);
		}
		return kept;
	}

	function stripKept(initial: Set<string>): Set<string> {
		let kept = greedyStrip(initial);
		kept = tryPairs(kept);
		kept = greedyStrip(kept);

		for (let kick = 0; kick < KICK_ROUNDS && !timeUp(); kick++) {
			if (kept.size < 3) {
				break;
			}
			const snapshot = new Set(kept);
			const removeCount = Math.min(kept.size - 1, 2 + rngInt(rng, 3));
			for (const key of rngShuffle(rng, [...kept]).slice(0, removeCount)) {
				kept.delete(key);
			}
			kept = repairNoAlternate(kept);
			if (!allowsStrip(kept)) {
				kept = snapshot;
				continue;
			}
			kept = greedyStrip(kept);
			kept = tryPairs(kept);
			kept = greedyStrip(kept);
			if (kept.size >= snapshot.size) {
				kept = snapshot;
			}
		}

		return kept;
	}

	for (let restart = 0; restart < STRIP_RESTARTS && !timeUp(); restart++) {
		consider(stripKept(new Set(allKeys)));
	}

	for (let restart = 0; restart < ADD_RESTARTS && !timeUp(); restart++) {
		const kept = new Set<string>();
		for (const key of rngShuffle(rng, allKeys)) {
			kept.add(key);
			if (allowsStrip(kept)) {
				break;
			}
		}
		if (!allowsStrip(kept)) {
			continue;
		}
		consider(stripKept(kept));
	}

	// 最終確認: 別解がある／未確認なら向きを足して安定させる
	const finalKept = new Set(bestKept);
	function finalOk(kept: Set<string>): boolean {
		const board = makeBoard(kept);
		const alt = hasAlternateSolution(board, intended, 250_000);
		if (alt.alternate) {
			return false;
		}
		if (alt.exhausted) {
			return true;
		}
		const counted = countSolutions(board, 2, 250_000);
		return counted.count === 1 && counted.exhausted;
	}
	if (!finalOk(finalKept)) {
		for (const key of rngShuffle(rng, allKeys)) {
			if (finalKept.has(key)) {
				continue;
			}
			finalKept.add(key);
			if (finalOk(finalKept)) {
				break;
			}
		}
	}

	return makeBoard(finalKept);
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
