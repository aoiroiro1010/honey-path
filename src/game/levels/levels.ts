import { generateBoard, MAX_DIFFICULTY_TIER } from "../generate";
import type { Board } from "../model/board";
import { colorsBoard, dirsBoard, lineBoard, numbersBoard } from "./samples";

export type Level = {
	id: string;
	name: string;
	board: Board;
};

export const TUTORIAL_LEVELS: Level[] = [
	{ id: "1", name: "線を引く", board: lineBoard },
	{ id: "2", name: "複数の色", board: colorsBoard },
	{ id: "3", name: "向き", board: dirsBoard },
	{ id: "4", name: "数字", board: numbersBoard },
];

export const TUTORIAL_COUNT = TUTORIAL_LEVELS.length;

const levelCache = new Map<string, Level>();

export function tierForLevelNumber(n: number): number {
	if (n <= TUTORIAL_COUNT) {
		return 0;
	}
	return Math.min(n - TUTORIAL_COUNT, MAX_DIFFICULTY_TIER);
}

export function getLevel(id: string): Level | undefined {
	const n = Number(id);
	if (!Number.isInteger(n) || n < 1) {
		return undefined;
	}

	if (n <= TUTORIAL_COUNT) {
		return TUTORIAL_LEVELS[n - 1];
	}

	const key = String(n);
	let level = levelCache.get(key);
	if (!level) {
		level = {
			id: key,
			name: `レベル ${n}`,
			board: generateBoard(n, tierForLevelNumber(n)),
		};
		levelCache.set(key, level);
	}
	return level;
}

export function nextLevelId(id: string): string {
	return String(Number(id) + 1);
}

export function isLevelUnlocked(id: string, cleared: string[]): boolean {
	const n = Number(id);
	if (n <= 1) {
		return true;
	}
	return cleared.includes(String(n - 1));
}

/** 選択画面に出すレベル番号（クリア済みの次まで＋少し先） */
export function visibleLevelNumbers(cleared: string[]): number[] {
	const highestCleared = cleared.reduce((max, id) => {
		const n = Number(id);
		return Number.isInteger(n) ? Math.max(max, n) : max;
	}, 0);
	const last = Math.max(TUTORIAL_COUNT, highestCleared + 1) + 2;
	return Array.from({ length: last }, (_, i) => i + 1);
}
