import { type Board, cellAt } from "../model/board";
import type { Color } from "../model/color";
import { dirBetween, HEX_DELTA, HEX_DIRS, type HexDir } from "../model/hex";
import { axialKey } from "./shape";

type Coord = { x: number; y: number };

/** 1色あたりのパス候補上限。達したら別解ありとみなす */
const PATH_CAP = 12;
const DEFAULT_NODE_BUDGET = 120_000;

function dirsMatch(
	dirs: { a: HexDir; b: HexDir },
	d1: HexDir,
	d2: HexDir,
): boolean {
	return (dirs.a === d1 && dirs.b === d2) || (dirs.a === d2 && dirs.b === d1);
}

function canStep(
	board: Board,
	color: Color,
	path: Coord[],
	next: Coord,
	free: Set<string>,
): boolean {
	const key = axialKey(next.x, next.y);
	if (!free.has(key)) {
		return false;
	}
	const tip = path[path.length - 1];
	let adjacent = false;
	for (const dir of HEX_DIRS) {
		const d = HEX_DELTA[dir];
		if (d.x === next.x - tip.x && d.y === next.y - tip.y) {
			adjacent = true;
			break;
		}
	}
	if (!adjacent) {
		return false;
	}

	const cell = cellAt(board, next.x, next.y);
	if (!cell) {
		return false;
	}
	if (cell.start && cell.start.color !== color) {
		return false;
	}
	if (cell.goal && cell.goal.color !== color) {
		return false;
	}
	if (cell.number && cell.number.color !== color) {
		return false;
	}

	const prev = path.length >= 2 ? path[path.length - 2] : undefined;
	const tipCell = cellAt(board, tip.x, tip.y);
	if (tipCell?.dirs) {
		if (!prev) {
			return false;
		}
		const toPrev = dirBetween(tip, prev);
		const toNext = dirBetween(tip, next);
		if (!toPrev || !toNext || !dirsMatch(tipCell.dirs, toPrev, toNext)) {
			return false;
		}
	}
	if (cell.dirs) {
		const entry = dirBetween(next, tip);
		if (!entry || (entry !== cell.dirs.a && entry !== cell.dirs.b)) {
			return false;
		}
	}

	if (cell.number) {
		let seen = 0;
		for (const coord of path) {
			const c = cellAt(board, coord.x, coord.y);
			if (c?.number?.color === color) {
				seen += 1;
			}
		}
		if (cell.number.value !== seen + 1) {
			return false;
		}
	}

	return true;
}

function numbersComplete(board: Board, color: Color, path: Coord[]): boolean {
	const required = board.cells
		.filter((cell) => cell.number?.color === color)
		.map((cell) => cell.number?.value)
		.filter((value): value is number => value !== undefined)
		.sort((a, b) => a - b);
	const got: number[] = [];
	for (const coord of path) {
		const number = cellAt(board, coord.x, coord.y)?.number;
		if (number?.color === color) {
			got.push(number.value);
		}
	}
	return (
		got.length === required.length &&
		got.every((value, index) => value === required[index])
	);
}

function enumeratePaths(
	board: Board,
	color: Color,
	start: Coord,
	goal: Coord,
	free: Set<string>,
	mustUseAll: boolean,
	nodes: { n: number; max: number },
	pathLimit: number,
): Coord[][] {
	const results: Coord[][] = [];
	const startKey = axialKey(start.x, start.y);
	if (!free.has(startKey)) {
		return results;
	}

	const path: Coord[] = [start];
	const used = new Set<string>([startKey]);

	function walk() {
		if (results.length >= pathLimit || nodes.n > nodes.max) {
			return;
		}
		nodes.n += 1;
		const tip = path[path.length - 1];
		if (tip.x === goal.x && tip.y === goal.y) {
			if (
				(!mustUseAll || used.size === free.size) &&
				numbersComplete(board, color, path)
			) {
				results.push(path.map((coord) => ({ ...coord })));
			}
			return;
		}

		for (const dir of HEX_DIRS) {
			const delta = HEX_DELTA[dir];
			const next = { x: tip.x + delta.x, y: tip.y + delta.y };
			const key = axialKey(next.x, next.y);
			if (used.has(key)) {
				continue;
			}
			if (!canStep(board, color, path, next, free)) {
				continue;
			}
			path.push(next);
			used.add(key);
			walk();
			used.delete(key);
			path.pop();
			if (results.length >= pathLimit || nodes.n > nodes.max) {
				return;
			}
		}
	}

	walk();
	return results;
}

/**
 * 解の個数を上限まで数える。
 * 候補過多・予算超過は「一意ではない」側に倒す。
 */
export function countSolutions(
	board: Board,
	limit = 2,
	nodeBudget = DEFAULT_NODE_BUDGET,
): { count: number; exhausted: boolean } {
	const jobs: { color: Color; start: Coord; goal: Coord }[] = [];
	for (const cell of board.cells) {
		if (!cell.start) {
			continue;
		}
		const goalCell = board.cells.find(
			(item) => item.goal?.color === cell.start?.color,
		);
		if (!goalCell || !cell.start) {
			continue;
		}
		jobs.push({
			color: cell.start.color,
			start: { x: cell.x, y: cell.y },
			goal: { x: goalCell.x, y: goalCell.y },
		});
	}

	if (jobs.length === 0) {
		return { count: 0, exhausted: true };
	}

	const allFree = new Set(board.cells.map((cell) => axialKey(cell.x, cell.y)));
	const nodes = { n: 0, max: nodeBudget };
	let found = 0;
	let exhausted = true;

	function rec(index: number, free: Set<string>) {
		if (found >= limit) {
			return;
		}
		if (nodes.n > nodes.max) {
			exhausted = false;
			return;
		}
		if (index === jobs.length) {
			if (free.size === 0) {
				found += 1;
			}
			return;
		}

		const job = jobs[index];
		const isLast = index === jobs.length - 1;
		const paths = enumeratePaths(
			board,
			job.color,
			job.start,
			job.goal,
			free,
			isLast,
			nodes,
			isLast ? Math.min(PATH_CAP, limit + 1) : PATH_CAP,
		);

		if (paths.length >= PATH_CAP) {
			found = Math.max(found, limit);
			return;
		}

		for (const path of paths) {
			const nextFree = new Set(free);
			for (const coord of path) {
				nextFree.delete(axialKey(coord.x, coord.y));
			}
			if (isLast && nextFree.size > 0) {
				continue;
			}
			rec(index + 1, nextFree);
			if (found >= limit || !exhausted) {
				return;
			}
		}
	}

	rec(0, allFree);
	if (nodes.n > nodes.max) {
		exhausted = false;
	}
	return { count: found, exhausted };
}

function pathSignature(coords: Coord[]): string {
	return coords.map((coord) => axialKey(coord.x, coord.y)).join("|");
}

/**
 * 正解以外の完全解があるかを探す。
 * 正解と同じ組み合わせは数えず、ずれを優先して探索する。
 */
export function hasAlternateSolution(
	board: Board,
	intended: { color: Color; coords: Coord[] }[],
	nodeBudget = DEFAULT_NODE_BUDGET,
): { alternate: boolean; exhausted: boolean } {
	const jobs: { color: Color; start: Coord; goal: Coord }[] = [];
	for (const cell of board.cells) {
		if (!cell.start) {
			continue;
		}
		const goalCell = board.cells.find(
			(item) => item.goal?.color === cell.start?.color,
		);
		if (!goalCell || !cell.start) {
			continue;
		}
		jobs.push({
			color: cell.start.color,
			start: { x: cell.x, y: cell.y },
			goal: { x: goalCell.x, y: goalCell.y },
		});
	}

	const intendedByColor = new Map(
		intended.map((path) => [path.color, path.coords] as const),
	);
	const intendedSigs = jobs.map((job) => {
		const coords = intendedByColor.get(job.color);
		return coords ? pathSignature(coords) : "";
	});

	if (jobs.length === 0 || intendedSigs.some((sig) => !sig)) {
		return { alternate: true, exhausted: true };
	}

	const allFree = new Set(board.cells.map((cell) => axialKey(cell.x, cell.y)));
	const nodes = { n: 0, max: nodeBudget };
	let alternate = false;
	let exhausted = true;

	function rec(index: number, free: Set<string>, differed: boolean) {
		if (alternate) {
			return;
		}
		if (nodes.n > nodes.max) {
			exhausted = false;
			return;
		}
		if (index === jobs.length) {
			if (free.size === 0 && differed) {
				alternate = true;
			}
			return;
		}

		const job = jobs[index];
		const isLast = index === jobs.length - 1;
		const paths = enumeratePaths(
			board,
			job.color,
			job.start,
			job.goal,
			free,
			isLast,
			nodes,
			PATH_CAP,
		);

		if (paths.length >= PATH_CAP) {
			alternate = true;
			return;
		}

		const intendedSig = intendedSigs[index];
		paths.sort((a, b) => {
			const aInt = pathSignature(a) === intendedSig ? 1 : 0;
			const bInt = pathSignature(b) === intendedSig ? 1 : 0;
			return aInt - bInt;
		});

		for (const path of paths) {
			const sig = pathSignature(path);
			const nextDiffered = differed || sig !== intendedSig;
			if (isLast && !nextDiffered) {
				continue;
			}
			const nextFree = new Set(free);
			for (const coord of path) {
				nextFree.delete(axialKey(coord.x, coord.y));
			}
			if (isLast && nextFree.size > 0) {
				continue;
			}
			rec(index + 1, nextFree, nextDiffered);
			if (alternate) {
				return;
			}
		}
	}

	rec(0, allFree, false);
	if (nodes.n > nodes.max) {
		exhausted = false;
	}
	return { alternate, exhausted };
}

/** 解がちょうど1つなら true */
export function isUniqueSolution(board: Board): boolean {
	const { count, exhausted } = countSolutions(board, 2);
	return exhausted && count === 1;
}
