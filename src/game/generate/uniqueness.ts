import type { Board } from "../model/board";
import type { Color } from "../model/color";
import { HEX_DELTA, HEX_DIRS } from "../model/hex";
import { axialKey } from "./shape";

type Coord = { x: number; y: number };

const PATH_CAP = 10;
const DEFAULT_NODE_BUDGET = 80_000;
const NDIR = 6;

export type FlatBoard = {
	n: number;
	neighbors: Int16Array;
	hasDirs: Uint8Array;
	dirSlotA: Uint8Array;
	dirSlotB: Uint8Array;
	startColor: Int8Array;
	goalColor: Int8Array;
	colorId: Map<Color, number>;
	jobStart: number[];
	jobGoal: number[];
	jobColor: number[];
	numValue: Uint8Array;
	numColor: Int8Array;
	hasAnyNumbers: boolean;
	requiredNums: number[][];
	/** cell index -> axial key */
	keys: string[];
};

function colorIds(board: Board): Map<Color, number> {
	const map = new Map<Color, number>();
	let next = 0;
	for (const cell of board.cells) {
		const c = cell.start?.color ?? cell.goal?.color ?? cell.number?.color;
		if (c && !map.has(c)) {
			map.set(c, next++);
		}
	}
	return map;
}

function neighborSlot(dx: number, dy: number): number {
	for (let d = 0; d < NDIR; d++) {
		const delta = HEX_DELTA[HEX_DIRS[d]];
		if (delta.x === dx && delta.y === dy) {
			return d;
		}
	}
	return -1;
}

/** 盤を整数インデックス化。向き ON/OFF は hasDirs を直接いじれる。 */
export function buildFlatBoard(board: Board): FlatBoard {
	const n = board.cells.length;
	const keyToIndex = new Map<string, number>();
	const keys: string[] = [];
	for (let i = 0; i < n; i++) {
		const cell = board.cells[i];
		const key = axialKey(cell.x, cell.y);
		keyToIndex.set(key, i);
		keys.push(key);
	}

	const ids = colorIds(board);
	const neighbors = new Int16Array(n * NDIR).fill(-1);
	const hasDirs = new Uint8Array(n);
	const dirSlotA = new Uint8Array(n);
	const dirSlotB = new Uint8Array(n);
	const startColor = new Int8Array(n).fill(-1);
	const goalColor = new Int8Array(n).fill(-1);
	const numValue = new Uint8Array(n);
	const numColor = new Int8Array(n).fill(-1);
	let hasAnyNumbers = false;

	for (let i = 0; i < n; i++) {
		const cell = board.cells[i];
		for (let d = 0; d < NDIR; d++) {
			const delta = HEX_DELTA[HEX_DIRS[d]];
			const j = keyToIndex.get(axialKey(cell.x + delta.x, cell.y + delta.y));
			neighbors[i * NDIR + d] = j === undefined ? -1 : j;
		}
		if (cell.start) {
			startColor[i] = ids.get(cell.start.color) ?? -1;
		}
		if (cell.goal) {
			goalColor[i] = ids.get(cell.goal.color) ?? -1;
		}
		if (cell.number) {
			hasAnyNumbers = true;
			numValue[i] = cell.number.value;
			numColor[i] = ids.get(cell.number.color) ?? -1;
		}
		if (cell.dirs) {
			hasDirs[i] = 1;
			const a = HEX_DELTA[cell.dirs.a];
			const b = HEX_DELTA[cell.dirs.b];
			dirSlotA[i] = neighborSlot(a.x, a.y);
			dirSlotB[i] = neighborSlot(b.x, b.y);
		}
	}

	const jobStart: number[] = [];
	const jobGoal: number[] = [];
	const jobColor: number[] = [];
	for (let i = 0; i < n; i++) {
		if (startColor[i] < 0) {
			continue;
		}
		const color = startColor[i];
		let goal = -1;
		for (let j = 0; j < n; j++) {
			if (goalColor[j] === color) {
				goal = j;
				break;
			}
		}
		if (goal >= 0) {
			jobStart.push(i);
			jobGoal.push(goal);
			jobColor.push(color);
		}
	}

	const colorCount = ids.size;
	const requiredNums: number[][] = Array.from(
		{ length: Math.max(colorCount, 1) },
		() => [],
	);
	if (hasAnyNumbers) {
		for (let i = 0; i < n; i++) {
			if (numColor[i] >= 0) {
				requiredNums[numColor[i]].push(numValue[i]);
			}
		}
		for (const list of requiredNums) {
			list.sort((a, b) => a - b);
		}
	}

	return {
		n,
		neighbors,
		hasDirs,
		dirSlotA,
		dirSlotB,
		startColor,
		goalColor,
		colorId: ids,
		jobStart,
		jobGoal,
		jobColor,
		numValue,
		numColor,
		hasAnyNumbers,
		requiredNums,
		keys,
	};
}

function tipDirsOk(
	flat: FlatBoard,
	tip: number,
	prev: number,
	nextSlot: number,
): boolean {
	if (!flat.hasDirs[tip]) {
		return true;
	}
	if (prev < 0) {
		return false;
	}
	let prevSlot = -1;
	const base = prev * NDIR;
	for (let d = 0; d < NDIR; d++) {
		if (flat.neighbors[base + d] === tip) {
			prevSlot = d;
			break;
		}
	}
	if (prevSlot < 0) {
		return false;
	}
	const entryAtTip = (prevSlot + 3) % 6;
	const a = flat.dirSlotA[tip];
	const b = flat.dirSlotB[tip];
	return (
		(entryAtTip === a && nextSlot === b) || (entryAtTip === b && nextSlot === a)
	);
}

function numbersOkOnReach(
	flat: FlatBoard,
	color: number,
	path: number[],
	len: number,
): boolean {
	if (!flat.hasAnyNumbers) {
		return true;
	}
	const required = flat.requiredNums[color] ?? [];
	if (required.length === 0) {
		for (let i = 0; i < len; i++) {
			if (flat.numColor[path[i]] === color) {
				return false;
			}
		}
		return true;
	}
	const got: number[] = [];
	for (let i = 0; i < len; i++) {
		const cell = path[i];
		if (flat.numColor[cell] === color) {
			got.push(flat.numValue[cell]);
		}
	}
	if (got.length !== required.length) {
		return false;
	}
	for (let i = 0; i < got.length; i++) {
		if (got[i] !== required[i]) {
			return false;
		}
	}
	return true;
}

function numberStepOk(
	flat: FlatBoard,
	color: number,
	path: number[],
	len: number,
	next: number,
): boolean {
	if (!flat.hasAnyNumbers) {
		return true;
	}
	const nc = flat.numColor[next];
	if (nc < 0) {
		return true;
	}
	if (nc !== color) {
		return false;
	}
	let seen = 0;
	for (let i = 0; i < len; i++) {
		if (flat.numColor[path[i]] === color) {
			seen += 1;
		}
	}
	return flat.numValue[next] === seen + 1;
}

type SearchState = {
	flat: FlatBoard;
	nodes: number;
	maxNodes: number;
	exhausted: boolean;
	pathBuf: number[];
	used: Uint8Array;
};

function collectPaths(
	state: SearchState,
	color: number,
	start: number,
	goal: number,
	free: Uint8Array,
	freeCount: number,
	mustUseAll: boolean,
	pathLimit: number,
): number[][] {
	const { flat } = state;
	const results: number[][] = [];
	if (!free[start]) {
		return results;
	}

	const path = state.pathBuf;
	path[0] = start;
	let len = 1;
	const used = state.used;
	used.fill(0);
	used[start] = 1;
	let usedCount = 1;

	function walk(prev: number) {
		if (results.length >= pathLimit || state.nodes > state.maxNodes) {
			return;
		}
		state.nodes += 1;
		const tip = path[len - 1];
		if (tip === goal) {
			if (
				(!mustUseAll || usedCount === freeCount) &&
				numbersOkOnReach(flat, color, path, len)
			) {
				results.push(path.slice(0, len));
			}
			return;
		}

		const base = tip * NDIR;
		for (let d = 0; d < NDIR; d++) {
			const next = flat.neighbors[base + d];
			if (next < 0 || used[next] || !free[next]) {
				continue;
			}
			if (!tipDirsOk(flat, tip, prev, d)) {
				continue;
			}
			const sc = flat.startColor[next];
			if (sc >= 0 && sc !== color) {
				continue;
			}
			const gc = flat.goalColor[next];
			if (gc >= 0 && gc !== color) {
				continue;
			}
			if (flat.hasDirs[next]) {
				const entry = (d + 3) % 6;
				if (entry !== flat.dirSlotA[next] && entry !== flat.dirSlotB[next]) {
					continue;
				}
			}
			if (!numberStepOk(flat, color, path, len, next)) {
				continue;
			}

			path[len] = next;
			len += 1;
			used[next] = 1;
			usedCount += 1;
			walk(tip);
			usedCount -= 1;
			used[next] = 0;
			len -= 1;
			if (results.length >= pathLimit || state.nodes > state.maxNodes) {
				return;
			}
		}
	}

	walk(-1);
	if (state.nodes > state.maxNodes) {
		state.exhausted = false;
	}
	return results;
}

function pathEqual(a: number[], b: number[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

function coordsToIndices(board: Board, coords: Coord[]): number[] | null {
	const keyToIndex = new Map<string, number>();
	for (let i = 0; i < board.cells.length; i++) {
		const cell = board.cells[i];
		keyToIndex.set(axialKey(cell.x, cell.y), i);
	}
	const out: number[] = [];
	for (const c of coords) {
		const i = keyToIndex.get(axialKey(c.x, c.y));
		if (i === undefined) {
			return null;
		}
		out.push(i);
	}
	return out;
}

/**
 * 高速一意判定。向きマスクを差し替えて繰り返し呼べる。
 */
export function createUniquenessChecker(
	board: Board,
	intended: { color: Color; coords: Coord[] }[],
) {
	const flat = buildFlatBoard(board);
	const intendedByJob: number[][] = [];
	for (let j = 0; j < flat.jobStart.length; j++) {
		const colorNum = flat.jobColor[j];
		let colorName: Color | undefined;
		for (const [name, id] of flat.colorId) {
			if (id === colorNum) {
				colorName = name;
				break;
			}
		}
		const path = intended.find((p) => p.color === colorName);
		const idx = path ? coordsToIndices(board, path.coords) : null;
		intendedByJob.push(idx ?? []);
	}

	const free = new Uint8Array(flat.n);
	const used = new Uint8Array(flat.n);
	const pathBuf = new Array<number>(flat.n);
	const dirMask = new Uint8Array(flat.n);
	dirMask.set(flat.hasDirs);

	function setKeptIndices(keptIndices: Iterable<number>) {
		flat.hasDirs.fill(0);
		for (const i of keptIndices) {
			if (dirMask[i]) {
				flat.hasDirs[i] = 1;
			}
		}
	}

	function setKeptKeys(kept: Set<string>) {
		flat.hasDirs.fill(0);
		for (let i = 0; i < flat.n; i++) {
			if (dirMask[i] && kept.has(flat.keys[i])) {
				flat.hasDirs[i] = 1;
			}
		}
	}

	function isUnique(nodeBudget: number): {
		unique: boolean;
		alternate: boolean;
		exhausted: boolean;
	} {
		if (
			flat.jobStart.length === 0 ||
			intendedByJob.some((p) => p.length === 0)
		) {
			return { unique: false, alternate: true, exhausted: true };
		}

		free.fill(1);
		const freeCount = flat.n;
		const state: SearchState = {
			flat,
			nodes: 0,
			maxNodes: nodeBudget,
			exhausted: true,
			pathBuf,
			used,
		};

		let alternate = false;

		function rec(jobIndex: number, remaining: number, differed: boolean) {
			if (alternate) {
				return;
			}
			if (state.nodes > state.maxNodes) {
				state.exhausted = false;
				return;
			}
			if (jobIndex === flat.jobStart.length) {
				if (remaining === 0 && differed) {
					alternate = true;
				}
				return;
			}

			const color = flat.jobColor[jobIndex];
			const start = flat.jobStart[jobIndex];
			const goal = flat.jobGoal[jobIndex];
			const isLast = jobIndex === flat.jobStart.length - 1;
			const intendedPath = intendedByJob[jobIndex];

			const paths = collectPaths(
				state,
				color,
				start,
				goal,
				free,
				remaining,
				isLast,
				PATH_CAP,
			);

			if (paths.length >= PATH_CAP) {
				alternate = true;
				return;
			}

			paths.sort((a, b) => {
				const aInt = pathEqual(a, intendedPath) ? 1 : 0;
				const bInt = pathEqual(b, intendedPath) ? 1 : 0;
				return aInt - bInt;
			});

			for (const path of paths) {
				const nextDiffered = differed || !pathEqual(path, intendedPath);
				if (isLast && !nextDiffered) {
					continue;
				}
				for (const cell of path) {
					free[cell] = 0;
				}
				const nextRemaining = remaining - path.length;
				if (!(isLast && nextRemaining > 0)) {
					rec(jobIndex + 1, nextRemaining, nextDiffered);
				}
				for (const cell of path) {
					free[cell] = 1;
				}
				if (alternate || !state.exhausted) {
					return;
				}
			}
		}

		rec(0, freeCount, false);
		if (state.nodes > state.maxNodes) {
			state.exhausted = false;
		}
		return {
			unique: !alternate && state.exhausted,
			alternate,
			exhausted: state.exhausted,
		};
	}

	function countUpTo(
		limit: number,
		nodeBudget: number,
	): { count: number; exhausted: boolean } {
		free.fill(1);
		const freeCount = flat.n;
		const state: SearchState = {
			flat,
			nodes: 0,
			maxNodes: nodeBudget,
			exhausted: true,
			pathBuf,
			used,
		};
		let found = 0;

		function rec(jobIndex: number, remaining: number) {
			if (found >= limit) {
				return;
			}
			if (state.nodes > state.maxNodes) {
				state.exhausted = false;
				return;
			}
			if (jobIndex === flat.jobStart.length) {
				if (remaining === 0) {
					found += 1;
				}
				return;
			}
			const color = flat.jobColor[jobIndex];
			const start = flat.jobStart[jobIndex];
			const goal = flat.jobGoal[jobIndex];
			const isLast = jobIndex === flat.jobStart.length - 1;
			const paths = collectPaths(
				state,
				color,
				start,
				goal,
				free,
				remaining,
				isLast,
				isLast ? Math.min(PATH_CAP, limit + 1) : PATH_CAP,
			);
			if (paths.length >= PATH_CAP) {
				found = Math.max(found, limit);
				return;
			}
			for (const path of paths) {
				for (const cell of path) {
					free[cell] = 0;
				}
				const nextRemaining = remaining - path.length;
				if (!(isLast && nextRemaining > 0)) {
					rec(jobIndex + 1, nextRemaining);
				}
				for (const cell of path) {
					free[cell] = 1;
				}
				if (found >= limit || !state.exhausted) {
					return;
				}
			}
		}

		rec(0, freeCount);
		if (state.nodes > state.maxNodes) {
			state.exhausted = false;
		}
		return { count: found, exhausted: state.exhausted };
	}

	/** 向きセルのインデックス一覧（初期フル） */
	const dirIndices: number[] = [];
	for (let i = 0; i < flat.n; i++) {
		if (dirMask[i]) {
			dirIndices.push(i);
		}
	}

	return {
		flat,
		dirIndices,
		dirMask,
		setKeptIndices,
		setKeptKeys,
		isUnique,
		countUpTo,
	};
}

export function countSolutions(
	board: Board,
	limit = 2,
	nodeBudget = DEFAULT_NODE_BUDGET,
): { count: number; exhausted: boolean } {
	const checker = createUniquenessChecker(board, []);
	return checker.countUpTo(limit, nodeBudget);
}

export function hasAlternateSolution(
	board: Board,
	intended: { color: Color; coords: Coord[] }[],
	nodeBudget = DEFAULT_NODE_BUDGET,
): { alternate: boolean; exhausted: boolean } {
	const checker = createUniquenessChecker(board, intended);
	const result = checker.isUnique(nodeBudget);
	return { alternate: result.alternate, exhausted: result.exhausted };
}

export function isUniqueSolution(board: Board): boolean {
	const { count, exhausted } = countSolutions(board, 2);
	return exhausted && count === 1;
}
