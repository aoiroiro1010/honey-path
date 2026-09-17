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

/** 向きの縛りがある面。中央の折れに従う */
export const dirsBoard: Board = {
	cells: [
		{ x: 0, y: 0, start: { color: "red" } },
		{ x: 1, y: 0, dirs: { a: "L", b: "BR" } },
		{ x: 1, y: 1, dirs: { a: "TL", b: "L" } },
		{ x: 0, y: 1, goal: { color: "red" } },
	],
	lines: [{ color: "red", coords: [] }],
};

/** 数字を順に拾う面。1 → 2 のあとゴール */
export const numbersBoard: Board = {
	cells: [
		{ x: 0, y: 0, start: { color: "red" } },
		{ x: 1, y: 0, number: { color: "red", value: 1 } },
		{ x: 1, y: -1, number: { color: "red", value: 2 } },
		{ x: 0, y: -1, goal: { color: "red" } },
	],
	lines: [{ color: "red", coords: [] }],
};
