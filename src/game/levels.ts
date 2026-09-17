import type { Board } from "./board";
import { dirsBoard, numbersBoard, sampleBoard } from "./samples";

export type Level = {
	id: string;
	name: string;
	board: Board;
};

export const LEVELS: Level[] = [
	{ id: "1", name: "レベル 1", board: sampleBoard },
	{ id: "2", name: "向き", board: dirsBoard },
	{ id: "3", name: "数字", board: numbersBoard },
];

export function getLevel(id: string): Level | undefined {
	return LEVELS.find((level) => level.id === id);
}

export function nextLevelId(id: string): string | undefined {
	const index = LEVELS.findIndex((level) => level.id === id);
	if (index < 0) {
		return undefined;
	}
	return LEVELS[index + 1]?.id;
}
