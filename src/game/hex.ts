export const HEX_DIRS = ["R", "TR", "TL", "L", "BL", "BR"] as const;

export type HexDir = (typeof HEX_DIRS)[number];

export const HEX_DELTA: Record<HexDir, { x: number; y: number }> = {
	R: { x: 1, y: 0 },
	TR: { x: 1, y: -1 },
	TL: { x: 0, y: -1 },
	L: { x: -1, y: 0 },
	BL: { x: -1, y: 1 },
	BR: { x: 0, y: 1 },
};

export function dirBetween(
	from: { x: number; y: number },
	to: { x: number; y: number },
): HexDir | null {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	for (const dir of HEX_DIRS) {
		const d = HEX_DELTA[dir];
		if (d.x === dx && d.y === dy) {
			return dir;
		}
	}
	return null;
}

export function isAdjacent(
	a: { x: number; y: number },
	b: { x: number; y: number },
): boolean {
	return dirBetween(a, b) !== null;
}
