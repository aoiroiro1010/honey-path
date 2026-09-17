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
