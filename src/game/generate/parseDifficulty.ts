import type { Difficulty } from "@/game/generate/difficulty";

export function parseIntField(value: string, fallback: number): number {
	const n = Number(value);
	return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function parseDifficulty(input: {
	radius: string;
	colorCount: string;
	holeCount: string;
	numbersPerColor: string;
}): Difficulty {
	return {
		radius: Math.max(1, parseIntField(input.radius, 5)),
		colorCount: Math.max(1, Math.min(6, parseIntField(input.colorCount, 1))),
		holeCount: Math.max(0, parseIntField(input.holeCount, 0)),
		numbersPerColor: Math.max(0, parseIntField(input.numbersPerColor, 0)),
	};
}
