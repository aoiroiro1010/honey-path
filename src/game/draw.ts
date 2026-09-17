import { type Board, cellAt } from "./board";
import type { Color } from "./color";
import { dirBetween, type HexDir, isAdjacent } from "./hex";
import type { Line } from "./line";

export function linesFromBoard(board: Board): Line[] {
	const lines: Line[] = [];
	for (const cell of board.cells) {
		if (cell.start) {
			lines.push({ color: cell.start.color, coords: [] });
		}
	}
	return lines;
}

export function occupantAt(
	lines: Line[],
	x: number,
	y: number,
): Color | undefined {
	for (const line of lines) {
		if (line.coords.some((c) => c.x === x && c.y === y)) {
			return line.color;
		}
	}
	return undefined;
}

function endpointColor(board: Board, x: number, y: number): Color | undefined {
	const cell = cellAt(board, x, y);
	return cell?.start?.color ?? cell?.goal?.color;
}

export function canEnter(
	board: Board,
	lines: Line[],
	color: Color,
	x: number,
	y: number,
): boolean {
	if (!cellAt(board, x, y)) {
		return false;
	}
	const occupant = occupantAt(lines, x, y);
	if (occupant && occupant !== color) {
		return false;
	}
	const endpoint = endpointColor(board, x, y);
	if (endpoint && endpoint !== color) {
		return false;
	}
	const number = cellAt(board, x, y)?.number;
	if (number && number.color !== color) {
		return false;
	}
	return true;
}

export function clearLine(lines: Line[], color: Color): Line[] {
	return lines.map((line) =>
		line.color === color ? { ...line, coords: [] } : line,
	);
}

export function truncateLine(
	lines: Line[],
	color: Color,
	index: number,
): Line[] {
	return lines.map((line) => {
		if (line.color !== color) {
			return line;
		}
		return { ...line, coords: line.coords.slice(0, index + 1) };
	});
}

export function beginAtStart(
	board: Board,
	lines: Line[],
	color: Color,
): Line[] {
	const start = board.cells.find((cell) => cell.start?.color === color);
	if (!start) {
		return lines;
	}
	return lines.map((line) =>
		line.color === color
			? { ...line, coords: [{ x: start.x, y: start.y }] }
			: line,
	);
}

function isGoalOf(board: Board, color: Color, x: number, y: number): boolean {
	const cell = cellAt(board, x, y);
	return cell?.goal?.color === color;
}

function dirsMatch(
	dirs: { a: HexDir; b: HexDir },
	d1: HexDir,
	d2: HexDir,
): boolean {
	return (dirs.a === d1 && dirs.b === d2) || (dirs.a === d2 && dirs.b === d1);
}

function nextNumberExpected(board: Board, line: Line, color: Color): number {
	let count = 0;
	for (const coord of line.coords) {
		const cell = cellAt(board, coord.x, coord.y);
		if (cell?.number?.color === color) {
			count += 1;
		}
	}
	return count + 1;
}

function canPassDirs(
	board: Board,
	tip: { x: number; y: number },
	next: { x: number; y: number },
	prev: { x: number; y: number } | undefined,
): boolean {
	const tipCell = cellAt(board, tip.x, tip.y);
	if (tipCell?.dirs) {
		if (!prev) {
			return false;
		}
		const toPrev = dirBetween(tip, prev);
		const toNext = dirBetween(tip, next);
		if (!toPrev || !toNext) {
			return false;
		}
		if (!dirsMatch(tipCell.dirs, toPrev, toNext)) {
			return false;
		}
	}

	const nextCell = cellAt(board, next.x, next.y);
	if (nextCell?.dirs) {
		const entry = dirBetween(next, tip);
		if (!entry) {
			return false;
		}
		if (entry !== nextCell.dirs.a && entry !== nextCell.dirs.b) {
			return false;
		}
	}

	return true;
}

function canPassNumber(
	board: Board,
	line: Line,
	color: Color,
	next: { x: number; y: number },
): boolean {
	const cell = cellAt(board, next.x, next.y);
	if (!cell?.number) {
		return true;
	}
	if (cell.number.color !== color) {
		return false;
	}
	return cell.number.value === nextNumberExpected(board, line, color);
}

export function tryExtend(
	board: Board,
	lines: Line[],
	color: Color,
	next: { x: number; y: number },
): Line[] | null {
	const line = lines.find((item) => item.color === color);
	if (!line || line.coords.length === 0) {
		return null;
	}
	const tip = line.coords[line.coords.length - 1];
	if (tip.x === next.x && tip.y === next.y) {
		return lines;
	}
	if (isGoalOf(board, color, tip.x, tip.y)) {
		return null;
	}
	if (!isAdjacent(tip, next)) {
		return null;
	}
	if (occupantAt(lines, next.x, next.y) === color) {
		return null;
	}
	if (!canEnter(board, lines, color, next.x, next.y)) {
		return null;
	}
	const prev =
		line.coords.length >= 2 ? line.coords[line.coords.length - 2] : undefined;
	if (!canPassDirs(board, tip, next, prev)) {
		return null;
	}
	if (!canPassNumber(board, line, color, next)) {
		return null;
	}
	return lines.map((item) =>
		item.color === color
			? { ...item, coords: [...item.coords, { x: next.x, y: next.y }] }
			: item,
	);
}

export function lineSegmentAt(
	line: Line,
	x: number,
	y: number,
): { a: HexDir; b?: HexDir } | undefined {
	const index = line.coords.findIndex((c) => c.x === x && c.y === y);
	if (index < 0) {
		return undefined;
	}
	const prev = line.coords[index - 1];
	const next = line.coords[index + 1];
	const toPrev = prev ? dirBetween({ x, y }, prev) : null;
	const toNext = next ? dirBetween({ x, y }, next) : null;
	if (toPrev && toNext) {
		return { a: toPrev, b: toNext };
	}
	if (toPrev) {
		return { a: toPrev };
	}
	if (toNext) {
		return { a: toNext };
	}
	return undefined;
}

export function lineAtCell(
	lines: Line[],
	x: number,
	y: number,
):
	| {
			color: Color;
			dirs: { a: HexDir; b?: HexDir };
	  }
	| undefined {
	for (const line of lines) {
		const dirs = lineSegmentAt(line, x, y);
		if (dirs) {
			return { color: line.color, dirs };
		}
	}
	return undefined;
}

export function isBoardCleared(board: Board, lines: Line[]): boolean {
	for (const cell of board.cells) {
		if (!occupantAt(lines, cell.x, cell.y)) {
			return false;
		}
	}

	for (const cell of board.cells) {
		if (!cell.start) {
			continue;
		}
		const color = cell.start.color;
		const goal = board.cells.find((item) => item.goal?.color === color);
		const line = lines.find((item) => item.color === color);
		if (!goal || !line || line.coords.length === 0) {
			return false;
		}
		const first = line.coords[0];
		const last = line.coords[line.coords.length - 1];
		if (first.x !== cell.x || first.y !== cell.y) {
			return false;
		}
		if (last.x !== goal.x || last.y !== goal.y) {
			return false;
		}
		if (!numbersCollectedInOrder(board, line, color)) {
			return false;
		}
	}

	return true;
}

function numbersCollectedInOrder(
	board: Board,
	line: Line,
	color: Color,
): boolean {
	const required = board.cells
		.filter((cell) => cell.number?.color === color)
		.map((cell) => cell.number?.value)
		.filter((value): value is number => value !== undefined)
		.sort((a, b) => a - b);

	const got: number[] = [];
	for (const coord of line.coords) {
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
