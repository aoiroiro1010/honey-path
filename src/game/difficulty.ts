export type Difficulty = {
	radius: number;
	colorCount: number;
	holeCount: number;
	/** 高難易度では 0（番号は易化するため） */
	numbersPerColor: number;
};

/** チュートリアル直後から上がり、これ以上は頭打ち */
export const MAX_DIFFICULTY_TIER = 8;

/**
 * 難易度が上がるほど色と盤を大きくする。最高帯は 6 色。
 * radius 3→37マス、4→61マス、5→91マス。
 */
const TIERS: Difficulty[] = [
	{ radius: 3, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 3, colorCount: 2, holeCount: 2, numbersPerColor: 0 },
	{ radius: 3, colorCount: 3, holeCount: 2, numbersPerColor: 0 },
	{ radius: 4, colorCount: 3, holeCount: 2, numbersPerColor: 0 },
	{ radius: 4, colorCount: 4, holeCount: 3, numbersPerColor: 0 },
	{ radius: 4, colorCount: 5, holeCount: 3, numbersPerColor: 0 },
	{ radius: 5, colorCount: 6, holeCount: 4, numbersPerColor: 0 },
	{ radius: 5, colorCount: 6, holeCount: 5, numbersPerColor: 0 },
];

export function difficultyForTier(tier: number): Difficulty {
	const index = Math.min(Math.max(tier, 1), MAX_DIFFICULTY_TIER) - 1;
	return TIERS[index];
}
