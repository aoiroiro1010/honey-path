import type { Board } from "./board";
import type { Cell } from "./cell";
import { COLORS, type Color } from "./color";
import { type Difficulty, difficultyForTier } from "./difficulty";
import { dirBetween } from "./hex";
import { createRng, rngPick, rngShuffle } from "./rng";
import { axialFromKey, axialKey, hexDisk, neighborKeys } from "./shape";

type Coord = { x: number; y: number };
type Path = { color: Color; coords: Coord[] };

const MAX_ATTEMPTS = 80;

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
		const options = neighborKeys(tip.x, tip.y).filter((key) =>
			remaining.has(key),
		);
		if (options.length === 0) {
			break;
		}
		const next = rngPick(rng, options);
		path.push(next);
		remaining.delete(next);
	}

	return path;
}

function partitionCells(
	cellKeys: string[],
	colorCount: number,
	rng: () => number,
): Path[] | null {
	const remaining = new Set(cellKeys);
	const colors = COLORS.slice(0, colorCount);
	const paths: Path[] = [];

	for (let i = 0; i < colors.length; i++) {
		const color = colors[i];
		const left = remaining.size;
		const colorsLeft = colors.length - i;
		if (left === 0) {
			return null;
		}

		const isLast = i === colors.length - 1;
		const target = isLast ? left : Math.max(2, Math.floor(left / colorsLeft));

		const start = rngPick(rng, [...remaining]);
		const keys = growPath(start, remaining, rng, target);

		if (keys.length < 2) {
			return null;
		}
		if (isLast && remaining.size > 0) {
			return null;
		}

		paths.push({
			color,
			coords: keys.map(axialFromKey),
		});
	}

	return paths;
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

function applyDirs(
	cells: Cell[],
	paths: Path[],
	dirCount: number,
	rng: () => number,
): Cell[] {
	if (dirCount <= 0) {
		return cells;
	}

	const byKey = new Map(
		cells.map((cell) => [axialKey(cell.x, cell.y), { ...cell }]),
	);
	const candidates: {
		key: string;
		a: NonNullable<Cell["dirs"]>["a"];
		b: NonNullable<Cell["dirs"]>["b"];
	}[] = [];

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
			candidates.push({ key: axialKey(curr.x, curr.y), a, b });
		}
	}

	for (const item of rngShuffle(rng, candidates).slice(0, dirCount)) {
		const cell = byKey.get(item.key);
		if (!cell || cell.start || cell.goal || cell.number) {
			continue;
		}
		cell.dirs = { a: item.a, b: item.b };
	}

	return [...byKey.values()];
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
		const internals = path.coords.slice(1, -1);
		if (internals.length === 0) {
			continue;
		}
		const count = Math.min(numbersPerColor, internals.length);
		// 経路順を保ったまま、だいたい等間隔で選ぶ
		const picks: Coord[] = [];
		for (let i = 0; i < count; i++) {
			const index = Math.floor(((i + 1) * internals.length) / (count + 1));
			picks.push(internals[Math.min(index, internals.length - 1)]);
		}

		const seen = new Set<string>();
		let value = 1;
		for (const coord of picks) {
			const key = axialKey(coord.x, coord.y);
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			const cell = byKey.get(key);
			if (!cell || cell.start || cell.goal) {
				continue;
			}
			cell.number = { color: path.color, value };
			value += 1;
		}

		// 重複で足りなければ、経路の手前から順に補充（ランダムにしない）
		for (const coord of internals) {
			if (value > count) {
				break;
			}
			const key = axialKey(coord.x, coord.y);
			if (seen.has(key)) {
				continue;
			}
			const cell = byKey.get(key);
			if (!cell || cell.start || cell.goal || cell.number) {
				continue;
			}
			seen.add(key);
			cell.number = { color: path.color, value };
			value += 1;
		}
	}

	return [...byKey.values()];
}

function buildFromPaths(
	baseCells: Cell[],
	paths: Path[],
	difficulty: Difficulty,
	rng: () => number,
): Board {
	// 数字を先に置き、向きは残りのマスへ（経路上の番号順を壊さない）
	let cells = applyEndpoints(baseCells, paths);
	cells = applyNumbers(cells, paths, difficulty.numbersPerColor);
	cells = applyDirs(cells, paths, difficulty.dirCount, rng);

	return {
		cells,
		lines: paths.map((path) => ({ color: path.color, coords: [] })),
	};
}

function tryGenerate(difficulty: Difficulty, rng: () => number): Board | null {
	let cells = hexDisk(difficulty.radius);
	cells = removeHoles(cells, difficulty.holeCount, rng);
	if (cells.length < difficulty.colorCount * 2) {
		return null;
	}

	const keys = cells.map((cell) => axialKey(cell.x, cell.y));
	const paths = partitionCells(keys, difficulty.colorCount, rng);
	if (!paths) {
		return null;
	}

	return buildFromPaths(cells, paths, difficulty, rng);
}

function fallbackBoard(seed: number): Board {
	const rng = createRng(seed ^ 0xabc);
	const cells = hexDisk(1);
	const keys = cells.map((cell) => axialKey(cell.x, cell.y));
	const paths = partitionCells(keys, 1, rng);
	if (paths) {
		return buildFromPaths(
			cells,
			paths,
			{
				radius: 1,
				colorCount: 1,
				holeCount: 0,
				dirCount: 0,
				numbersPerColor: 0,
			},
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
