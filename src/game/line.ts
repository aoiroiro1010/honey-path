import type { Color } from "./color";

export type Line = {
	color: Color;
	coords: { x: number; y: number }[];
};
