import type { Cell } from "../model/cell";
import { HEX_DELTA, HEX_DIRS } from "../model/hex";

export function axialKey(x: number, y: number): string {
	return `${x},${y}`;
}

export function axialFromKey(key: string): { x: number; y: number } {
	const [x, y] = key.split(",").map(Number);
	return { x, y };
}

export function hexDisk(radius: number): Cell[] {
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

export function neighborKeys(x: number, y: number): string[] {
	return HEX_DIRS.map((dir) => {
		const d = HEX_DELTA[dir];
		return axialKey(x + d.x, y + d.y);
	});
}
