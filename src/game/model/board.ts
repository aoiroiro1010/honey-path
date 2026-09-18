import type { Cell } from "./cell";
import type { Line } from "./line";

export type Board = {
	cells: Cell[];
	/** 正解の色ごとの経路（進捗表示・生成用）。プレイヤー線とは別 */
	solution: Line[];
};

export function cellAt(board: Board, x: number, y: number): Cell | undefined {
	return board.cells.find((cell) => cell.x === x && cell.y === y);
}
