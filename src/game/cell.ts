import type { Color } from "./color";
import { HEX_DELTA, type HexDir } from "./hex";

export type Cell = {
	x: number;
	y: number;
	dirs?: {
		a: HexDir;
		b: HexDir;
	};
	number?: {
		color: Color;
		value: number;
	};
	start?: {
		color: Color;
	};
	goal?: {
		color: Color;
	};
};

export function cellsEqual(a: Cell, b: Cell): boolean {
	return a.x === b.x && a.y === b.y;
}

export function neighbor(cell: Cell, dir: HexDir): Cell {
	const d = HEX_DELTA[dir];
	return { x: cell.x + d.x, y: cell.y + d.y };
}
