import type { Cell } from "./cell";
import type { Line } from "./line";

export type Board = {
	cells: Cell[];
	lines: Line[];
};

export function cellAt(board: Board, x: number, y: number): Cell | undefined {
	return board.cells.find((cell) => cell.x === x && cell.y === y);
}
