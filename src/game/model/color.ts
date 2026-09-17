export const COLORS = [
	"red",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
] as const;

export type Color = (typeof COLORS)[number];
