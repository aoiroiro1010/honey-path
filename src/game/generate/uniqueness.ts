import type { Board } from "../model/board";
import type { Color } from "../model/color";
import { HEX_DELTA, HEX_DIRS } from "../model/hex";
import { axialKey } from "./shape";

type Coord = { x: number; y: number };

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

function numbersComplete(
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
	let gi = 0;
	for (let i = 0; i < len; i++) {
		const cell = path[i];
		if (flat.numColor[cell] === color) {
			if (gi >= required.length || flat.numValue[cell] !== required[gi]) {
				return false;
			}
			gi += 1;
		}
	}
	return gi === required.length;
}

function numberStepOk(
	flat: FlatBoard,
	color: number,
	next: number,
	numSeen: number,
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
	return flat.numValue[next] === numSeen + 1;
}

function pathPrefixEqual(
	path: number[],
	len: number,
	intended: number[],
): boolean {
	if (len > intended.length) {
		return false;
	}
	for (let i = 0; i < len; i++) {
		if (path[i] !== intended[i]) {
			return false;
		}
	}
	return true;
}

function coordsToIndices(
	keyToIndex: Map<string, number>,
	coords: Coord[],
): number[] | null {
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
 * 高速一意判定。向きは hasDirs を直接トグルして繰り返し判定できる。
 */
export function createUniquenessChecker(
	board: Board,
	intended: { color: Color; coords: Coord[] }[],
) {
	const flat = buildFlatBoard(board);
	const keyToIndex = new Map(flat.keys.map((k, i) => [k, i]));
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
		const idx = path ? coordsToIndices(keyToIndex, path.coords) : null;
		intendedByJob.push(idx ?? []);
	}

	const free = new Uint8Array(flat.n);
	const pathBuf = new Array<number>(flat.n);
	const pathSave = new Array<number>(
		flat.n * Math.max(flat.jobStart.length, 1),
	);
	const dirFull = new Uint8Array(flat.n);
	dirFull.set(flat.hasDirs);

	const dirIndices: number[] = [];
	for (let i = 0; i < flat.n; i++) {
		if (dirFull[i]) {
			dirIndices.push(i);
		}
	}

	/** kept ビット（dirIndices 順）。BigInt でキャッシュキーにも使う */
	let keptBits = 0n;
	const bitOf = new Map<number, number>();
	for (let b = 0; b < dirIndices.length; b++) {
		bitOf.set(dirIndices[b], b);
		keptBits |= 1n << BigInt(b);
	}

	function syncHasDirsFromBits() {
		flat.hasDirs.fill(0);
		for (let b = 0; b < dirIndices.length; b++) {
			if ((keptBits >> BigInt(b)) & 1n) {
				flat.hasDirs[dirIndices[b]] = 1;
			}
		}
	}

	function setKeptIndices(keptIndices: Iterable<number>) {
		keptBits = 0n;
		for (const i of keptIndices) {
			const b = bitOf.get(i);
			if (b !== undefined) {
				keptBits |= 1n << BigInt(b);
			}
		}
		syncHasDirsFromBits();
	}

	function clearDirBit(cellIndex: number): bigint {
		const b = bitOf.get(cellIndex);
		if (b === undefined) {
			return keptBits;
		}
		const prev = keptBits;
		keptBits &= ~(1n << BigInt(b));
		flat.hasDirs[cellIndex] = 0;
		return prev;
	}

	function restoreBits(prev: bigint) {
		const changed = keptBits ^ prev;
		keptBits = prev;
		for (let b = 0; b < dirIndices.length; b++) {
			if ((changed >> BigInt(b)) & 1n) {
				flat.hasDirs[dirIndices[b]] = (prev >> BigInt(b)) & 1n ? 1 : 0;
			}
		}
	}

	function setDirBit(cellIndex: number, on: boolean) {
		const b = bitOf.get(cellIndex);
		if (b === undefined) {
			return;
		}
		if (on) {
			keptBits |= 1n << BigInt(b);
			flat.hasDirs[cellIndex] = 1;
		} else {
			keptBits &= ~(1n << BigInt(b));
			flat.hasDirs[cellIndex] = 0;
		}
	}

	/**
	 * 一体型 DFS: パスを全部集めてから組み合わせず、逸脱を優先して探索。
	 */
	function isUnique(
		nodeBudget: number,
		hardDeadlineMs?: number,
	): {
		unique: boolean;
		alternate: boolean;
		exhausted: boolean;
		bits: bigint;
	} {
		if (
			flat.jobStart.length === 0 ||
			intendedByJob.some((p) => p.length === 0)
		) {
			return {
				unique: false,
				alternate: true,
				exhausted: true,
				bits: keptBits,
			};
		}

		const total = flat.n;
		const jobs = flat.jobStart.length;
		free.fill(1);
		let nodes = 0;
		let exhausted = true;
		let alternate = false;
		const path = pathBuf;
		const deadline = hardDeadlineMs ?? Number.POSITIVE_INFINITY;

		function overBudget() {
			if (nodes > nodeBudget) {
				exhausted = false;
				return true;
			}
			if (nodes % 512 === 0 && Date.now() >= deadline) {
				exhausted = false;
				return true;
			}
			return false;
		}

		function searchJob(jobIndex: number, usedCount: number, differed: boolean) {
			if (alternate || overBudget()) {
				return;
			}

			const color = flat.jobColor[jobIndex];
			const start = flat.jobStart[jobIndex];
			const goal = flat.jobGoal[jobIndex];
			const intendedPath = intendedByJob[jobIndex];
			const isLast = jobIndex === jobs - 1;

			if (!free[start]) {
				return;
			}

			path[0] = start;
			free[start] = 0;

			function dfs(
				len: number,
				prev: number,
				prevSlot: number,
				numSeen: number,
				used: number,
			) {
				if (alternate || overBudget()) {
					return;
				}
				nodes += 1;
				const tip = path[len - 1];

				if (tip === goal) {
					if (!numbersComplete(flat, color, path, len)) {
						return;
					}
					const pathDiffered =
						differed ||
						len !== intendedPath.length ||
						!pathPrefixEqual(path, len, intendedPath);
					if (isLast) {
						if (used === total && pathDiffered) {
							alternate = true;
						}
						return;
					}
					const saveBase = jobIndex * total;
					for (let i = 0; i < len; i++) {
						pathSave[saveBase + i] = path[i];
					}
					searchJob(jobIndex + 1, used, pathDiffered);
					for (let i = 0; i < len; i++) {
						path[i] = pathSave[saveBase + i];
					}
					return;
				}

				const onPrefix = pathPrefixEqual(path, len, intendedPath);
				const intendedNext =
					onPrefix && len < intendedPath.length ? intendedPath[len] : -1;
				const base = tip * NDIR;

				for (let pass = 0; pass < 2; pass++) {
					for (let d = 0; d < NDIR; d++) {
						const next = flat.neighbors[base + d];
						if (next < 0 || !free[next]) {
							continue;
						}
						const isIntended = next === intendedNext;
						if (pass === 0 && isIntended) {
							continue;
						}
						if (pass === 1 && intendedNext >= 0 && !isIntended) {
							continue;
						}

						if (flat.hasDirs[tip]) {
							if (prev < 0) {
								continue;
							}
							const entryAtTip = (prevSlot + 3) % 6;
							const a = flat.dirSlotA[tip];
							const b = flat.dirSlotB[tip];
							if (
								!(
									(entryAtTip === a && d === b) ||
									(entryAtTip === b && d === a)
								)
							) {
								continue;
							}
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
							if (
								entry !== flat.dirSlotA[next] &&
								entry !== flat.dirSlotB[next]
							) {
								continue;
							}
						}
						if (!numberStepOk(flat, color, next, numSeen)) {
							continue;
						}

						const nextNumSeen =
							flat.hasAnyNumbers && flat.numColor[next] === color
								? numSeen + 1
								: numSeen;

						path[len] = next;
						free[next] = 0;
						dfs(len + 1, tip, d, nextNumSeen, used + 1);
						free[next] = 1;
						if (alternate || !exhausted) {
							return;
						}
					}
					if (intendedNext < 0) {
						break;
					}
				}
			}

			dfs(1, -1, -1, 0, usedCount + 1);
			free[start] = 1;
		}

		searchJob(0, 0, false);
		if (nodes > nodeBudget) {
			exhausted = false;
		}
		return {
			unique: !alternate && exhausted,
			alternate,
			exhausted,
			bits: keptBits,
		};
	}

	function countUpTo(
		limit: number,
		nodeBudget: number,
	): { count: number; exhausted: boolean } {
		const total = flat.n;
		const jobs = flat.jobStart.length;
		if (jobs === 0) {
			return { count: 0, exhausted: true };
		}
		free.fill(1);
		let nodes = 0;
		let exhausted = true;
		let found = 0;
		const path = pathBuf;

		function searchJob(jobIndex: number, usedCount: number) {
			if (found >= limit || nodes > nodeBudget) {
				if (nodes > nodeBudget) {
					exhausted = false;
				}
				return;
			}
			const color = flat.jobColor[jobIndex];
			const start = flat.jobStart[jobIndex];
			const goal = flat.jobGoal[jobIndex];
			const isLast = jobIndex === jobs - 1;
			if (!free[start]) {
				return;
			}
			path[0] = start;
			free[start] = 0;

			function dfs(
				len: number,
				prev: number,
				prevSlot: number,
				numSeen: number,
				used: number,
			) {
				if (found >= limit || nodes > nodeBudget) {
					if (nodes > nodeBudget) {
						exhausted = false;
					}
					return;
				}
				nodes += 1;
				const tip = path[len - 1];
				if (tip === goal) {
					if (!numbersComplete(flat, color, path, len)) {
						return;
					}
					if (isLast) {
						if (used === total) {
							found += 1;
						}
						return;
					}
					const saveBase = jobIndex * total;
					for (let i = 0; i < len; i++) {
						pathSave[saveBase + i] = path[i];
					}
					searchJob(jobIndex + 1, used);
					for (let i = 0; i < len; i++) {
						path[i] = pathSave[saveBase + i];
					}
					return;
				}
				const base = tip * NDIR;
				for (let d = 0; d < NDIR; d++) {
					const next = flat.neighbors[base + d];
					if (next < 0 || !free[next]) {
						continue;
					}
					if (flat.hasDirs[tip]) {
						if (prev < 0) {
							continue;
						}
						const entryAtTip = (prevSlot + 3) % 6;
						const a = flat.dirSlotA[tip];
						const b = flat.dirSlotB[tip];
						if (
							!((entryAtTip === a && d === b) || (entryAtTip === b && d === a))
						) {
							continue;
						}
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
						if (
							entry !== flat.dirSlotA[next] &&
							entry !== flat.dirSlotB[next]
						) {
							continue;
						}
					}
					if (!numberStepOk(flat, color, next, numSeen)) {
						continue;
					}
					const nextNumSeen =
						flat.hasAnyNumbers && flat.numColor[next] === color
							? numSeen + 1
							: numSeen;
					path[len] = next;
					free[next] = 0;
					dfs(len + 1, tip, d, nextNumSeen, used + 1);
					free[next] = 1;
					if (found >= limit || !exhausted) {
						return;
					}
				}
			}

			dfs(1, -1, -1, 0, usedCount + 1);
			free[start] = 1;
		}

		searchJob(0, 0);
		if (nodes > nodeBudget) {
			exhausted = false;
		}
		return { count: found, exhausted };
	}

	return {
		flat,
		dirIndices,
		dirFull,
		get bits() {
			return keptBits;
		},
		setKeptIndices,
		clearDirBit,
		restoreBits,
		setDirBit,
		syncHasDirsFromBits,
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
	// intended empty → isUnique early-returns; use count with dirs as-is
	checker.setKeptIndices(checker.dirIndices.filter((i) => checker.dirFull[i]));
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
