import type { Board } from "../model/board";

/** 1: スタートからゴールまで線を引くだけ */
export const lineBoard: Board = {
	cells: [
		{ x: 0, y: 0, start: { color: "red" } },
		{ x: 1, y: 0 },
		{ x: 1, y: 1 },
		{ x: 2, y: 1 },
		{ x: 3, y: 0, goal: { color: "red" } },
	],
	solution: [
		{
			color: "red",
			coords: [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 1, y: 1 },
				{ x: 2, y: 1 },
				{ x: 3, y: 0 },
			],
		},
	],
};

/** 2: 色ごとに別々の線を引く */
export const colorsBoard: Board = {
	cells: [
		{ x: 0, y: 0, start: { color: "red" } },
		{ x: 1, y: 0 },
		{ x: 2, y: 0, goal: { color: "red" } },
		{ x: 0, y: 1, start: { color: "blue" } },
		{ x: 0, y: 2 },
		{ x: 1, y: 1 },
		{ x: 2, y: 1, goal: { color: "blue" } },
	],
	solution: [
		{
			color: "red",
			coords: [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 2, y: 0 },
			],
		},
		{
			color: "blue",
			coords: [
				{ x: 0, y: 1 },
				{ x: 0, y: 2 },
				{ x: 1, y: 1 },
				{ x: 2, y: 1 },
			],
		},
	],
};

/** 3: 向きの印どおりに通る */
export const dirsBoard: Board = {
	cells: [
		{ x: 0, y: 0, start: { color: "red" } },
		{ x: 1, y: 0 },
		{ x: 2, y: 0, dirs: { a: "L", b: "BR" } },
		{ x: 1, y: 1 },
		{ x: 2, y: 1, dirs: { a: "TL", b: "L" } },
		{ x: 0, y: 1, goal: { color: "red" } },
	],
	solution: [
		{
			color: "red",
			coords: [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 2, y: 0 },
				{ x: 1, y: 1 },
				{ x: 2, y: 1 },
				{ x: 0, y: 1 },
			],
		},
	],
};

/** 4: 数字を色ごと順に拾ってからゴール */
export const numbersBoard: Board = {
	cells: [
		{ x: 0, y: 0, start: { color: "red" } },
		{ x: 1, y: -1 },
		{ x: 1, y: 0 },
		{ x: 2, y: 0, number: { color: "red", value: 1 } },
		{ x: 2, y: -1, number: { color: "red", value: 2 } },
		{ x: 0, y: -1, goal: { color: "red" } },
	],
	solution: [
		{
			color: "red",
			coords: [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 2, y: 0 },
				{ x: 2, y: -1 },
				{ x: 1, y: -1 },
				{ x: 0, y: -1 },
			],
		},
	],
};

/** Storybook 用の別名 */
export const sampleBoard = colorsBoard;
