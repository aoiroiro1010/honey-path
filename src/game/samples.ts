import type { Board } from "@/game/board";
import type { Cell } from "@/game/cell";

function hexDisk(radius: number): Cell[] {
	const cells: Cell[] = [];
	for (let x = -radius; x <= radius; x++) {
		for (
			let y = Math.max(-radius, -x - radius);
			y <= Math.min(radius, -x + radius);
			y++
		) {
			cells.push({ x, y });
		}
	}
	return cells;
}

/** 一辺 2 の六角形から中央を抜いた、線も縛りもないサンプル */
export const sampleBoard: Board = {
	cells: hexDisk(2).filter((cell) => !(cell.x === 0 && cell.y === 0)),
	lines: [],
};
