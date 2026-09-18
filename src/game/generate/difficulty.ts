export type Difficulty = {
	radius: number;
	colorCount: number;
	holeCount: number;
	/** 増やすと易化しやすい */
	numbersPerColor: number;
};

/**
 * チュートリアル直後からの上昇テーブル。
 * 少色・大盤・少穴・番号少〜なしがむずかしい、という実測に合わせる。
 */
const TIERS: Difficulty[] = [
	{ radius: 1, colorCount: 1, holeCount: 0, numbersPerColor: 0 },
	{ radius: 1, colorCount: 1, holeCount: 0, numbersPerColor: 1 },
	{ radius: 1, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 1, colorCount: 2, holeCount: 0, numbersPerColor: 1 },

	{ radius: 2, colorCount: 1, holeCount: 0, numbersPerColor: 0 },
	{ radius: 2, colorCount: 1, holeCount: 0, numbersPerColor: 1 },
	{ radius: 2, colorCount: 1, holeCount: 1, numbersPerColor: 0 },
	{ radius: 2, colorCount: 1, holeCount: 1, numbersPerColor: 1 },
	{ radius: 2, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 0, numbersPerColor: 1 },
	{ radius: 2, colorCount: 2, holeCount: 1, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 1, numbersPerColor: 1 },

	{ radius: 3, colorCount: 1, holeCount: 0, numbersPerColor: 0 },
	{ radius: 3, colorCount: 1, holeCount: 0, numbersPerColor: 2 },
	{ radius: 3, colorCount: 1, holeCount: 3, numbersPerColor: 0 },
	{ radius: 3, colorCount: 1, holeCount: 3, numbersPerColor: 2 },
	{ radius: 3, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 3, colorCount: 2, holeCount: 0, numbersPerColor: 2 },
	{ radius: 3, colorCount: 2, holeCount: 3, numbersPerColor: 0 },
	{ radius: 3, colorCount: 2, holeCount: 3, numbersPerColor: 2 },
	{ radius: 3, colorCount: 3, holeCount: 0, numbersPerColor: 0 },
	{ radius: 3, colorCount: 3, holeCount: 0, numbersPerColor: 2 },
	{ radius: 3, colorCount: 3, holeCount: 3, numbersPerColor: 0 },
	{ radius: 3, colorCount: 3, holeCount: 3, numbersPerColor: 2 },

	{ radius: 4, colorCount: 1, holeCount: 0, numbersPerColor: 0 },
	{ radius: 4, colorCount: 1, holeCount: 0, numbersPerColor: 2 },
	{ radius: 4, colorCount: 1, holeCount: 3, numbersPerColor: 0 },
	{ radius: 4, colorCount: 1, holeCount: 3, numbersPerColor: 2 },
	{ radius: 4, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 4, colorCount: 2, holeCount: 0, numbersPerColor: 2 },
	{ radius: 4, colorCount: 2, holeCount: 3, numbersPerColor: 0 },
	{ radius: 4, colorCount: 2, holeCount: 3, numbersPerColor: 2 },
	{ radius: 4, colorCount: 3, holeCount: 0, numbersPerColor: 0 },
	{ radius: 4, colorCount: 3, holeCount: 0, numbersPerColor: 2 },
	{ radius: 4, colorCount: 3, holeCount: 3, numbersPerColor: 0 },
	{ radius: 4, colorCount: 3, holeCount: 3, numbersPerColor: 2 },
	{ radius: 4, colorCount: 4, holeCount: 0, numbersPerColor: 0 },
	{ radius: 4, colorCount: 4, holeCount: 0, numbersPerColor: 2 },
	{ radius: 4, colorCount: 4, holeCount: 3, numbersPerColor: 0 },
	{ radius: 4, colorCount: 4, holeCount: 3, numbersPerColor: 2 },

	{ radius: 5, colorCount: 1, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 1, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 1, holeCount: 3, numbersPerColor: 0 },
	{ radius: 5, colorCount: 1, holeCount: 3, numbersPerColor: 2 },
	{ radius: 5, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 2, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 2, holeCount: 3, numbersPerColor: 0 },
	{ radius: 5, colorCount: 2, holeCount: 3, numbersPerColor: 2 },
	{ radius: 5, colorCount: 3, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 3, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 3, holeCount: 3, numbersPerColor: 0 },
	{ radius: 5, colorCount: 3, holeCount: 3, numbersPerColor: 2 },
	{ radius: 5, colorCount: 4, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 4, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 4, holeCount: 3, numbersPerColor: 0 },
	{ radius: 5, colorCount: 4, holeCount: 3, numbersPerColor: 2 },
];

/** 上昇テーブルを使い切ったあとの最高難易度ループ */
const MAX_DIFFICULT_LOOP: Difficulty[] = [
	{ radius: 2, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 0, numbersPerColor: 1 },
	{ radius: 2, colorCount: 2, holeCount: 1, numbersPerColor: 0 },
	{ radius: 2, colorCount: 2, holeCount: 1, numbersPerColor: 1 },

	{ radius: 3, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 3, colorCount: 2, holeCount: 0, numbersPerColor: 2 },
	{ radius: 3, colorCount: 2, holeCount: 2, numbersPerColor: 0 },
	{ radius: 3, colorCount: 2, holeCount: 2, numbersPerColor: 2 },

	{ radius: 4, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 4, colorCount: 2, holeCount: 0, numbersPerColor: 2 },
	{ radius: 4, colorCount: 2, holeCount: 4, numbersPerColor: 0 },
	{ radius: 4, colorCount: 2, holeCount: 4, numbersPerColor: 2 },
	{ radius: 4, colorCount: 3, holeCount: 0, numbersPerColor: 0 },
	{ radius: 4, colorCount: 3, holeCount: 0, numbersPerColor: 2 },
	{ radius: 4, colorCount: 3, holeCount: 4, numbersPerColor: 0 },
	{ radius: 4, colorCount: 3, holeCount: 4, numbersPerColor: 2 },

	{ radius: 5, colorCount: 2, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 2, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 2, holeCount: 4, numbersPerColor: 0 },
	{ radius: 5, colorCount: 2, holeCount: 4, numbersPerColor: 2 },
	{ radius: 5, colorCount: 3, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 3, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 3, holeCount: 4, numbersPerColor: 0 },
	{ radius: 5, colorCount: 3, holeCount: 4, numbersPerColor: 2 },
	{ radius: 5, colorCount: 4, holeCount: 0, numbersPerColor: 0 },
	{ radius: 5, colorCount: 4, holeCount: 0, numbersPerColor: 2 },
	{ radius: 5, colorCount: 4, holeCount: 4, numbersPerColor: 0 },
	{ radius: 5, colorCount: 4, holeCount: 4, numbersPerColor: 2 },
];

/** 上昇テーブルの段数（生成 index 1‥この値） */
export const MAX_DIFFICULTY_TIER = TIERS.length;

export function difficultyForTier(tier: number): Difficulty {
	const index = Math.min(Math.max(tier, 1), TIERS.length) - 1;
	return TIERS[index];
}

/**
 * 生成レベル通し番号（1 = ゲームのレベル 5）に対する難易度。
 * 1‥TIERS.length は上昇テーブル、それ以降は MAX_DIFFICULT_LOOP を繰り返す。
 */
export function difficultyForGeneratedIndex(index: number): Difficulty {
	if (index <= TIERS.length) {
		return difficultyForTier(index);
	}
	const loopIndex = (index - TIERS.length - 1) % MAX_DIFFICULT_LOOP.length;
	return MAX_DIFFICULT_LOOP[loopIndex];
}
