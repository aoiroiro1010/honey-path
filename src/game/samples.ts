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

const ring = hexDisk(2).filter((cell) => !(cell.x === 0 && cell.y === 0));

/** 線も縛りもない穴あき面に、赤・青のスタートとゴールを置いたサンプル */
export const sampleBoard: Board = {
	cells: ring.map((cell) => {
		if (cell.x === -2 && cell.y === 0) {
			return { ...cell, start: { color: "red" } };
		}
		if (cell.x === 2 && cell.y === 0) {
			return { ...cell, goal: { color: "red" } };
		}
		if (cell.x === 0 && cell.y === -2) {
			return { ...cell, start: { color: "blue" } };
		}
		if (cell.x === 0 && cell.y === 2) {
			return { ...cell, goal: { color: "blue" } };
		}
		return cell;
	}),
	lines: [
		{ color: "red", coords: [] },
		{ color: "blue", coords: [] },
	],
};
