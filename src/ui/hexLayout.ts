export const CELL_SIZE = 30;
export const CELL_PAD = 2;
export const CELL_VIEW_SIZE = (CELL_SIZE + CELL_PAD) * 2;

export function cellToPixel(
	x: number,
	y: number,
): { left: number; top: number } {
	return {
		left: CELL_SIZE * Math.sqrt(3) * (x + y / 2),
		top: CELL_SIZE * (3 / 2) * y,
	};
}
