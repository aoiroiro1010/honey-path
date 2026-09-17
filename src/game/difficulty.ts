export type Difficulty = {
	radius: number;
	colorCount: number;
	holeCount: number;
	dirCount: number;
	numbersPerColor: number;
};

/** チュートリアル（手配置）の直後から上がり、これ以上は頭打ち */
export const MAX_DIFFICULTY_TIER = 8;

const TIERS: Difficulty[] = [
	{ radius: 1, colorCount: 1, holeCount: 0, dirCount: 0, numbersPerColor: 0 },
	{ radius: 1, colorCount: 1, holeCount: 0, dirCount: 1, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 0, dirCount: 0, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 1, dirCount: 2, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 1, dirCount: 2, numbersPerColor: 1 },
	{ radius: 2, colorCount: 3, holeCount: 1, dirCount: 3, numbersPerColor: 1 },
	{ radius: 2, colorCount: 3, holeCount: 2, dirCount: 4, numbersPerColor: 1 },
	{ radius: 2, colorCount: 3, holeCount: 2, dirCount: 5, numbersPerColor: 2 },
];

export function difficultyForTier(tier: number): Difficulty {
	const index = Math.min(Math.max(tier, 1), MAX_DIFFICULTY_TIER) - 1;
	return TIERS[index];
}
