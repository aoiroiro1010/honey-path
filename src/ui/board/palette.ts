import type { Color } from "@/game/model/color";

export const COLOR_HEX: Record<Color, string> = {
	red: "#ef4444",
	orange: "#f97316",
	yellow: "#eab308",
	green: "#22c55e",
	blue: "#3b82f6",
	purple: "#a855f7",
};

/** 線が通ったマス用の薄い背景色 */
export function paleColorHex(color: Color, mix = 0.78): string {
	const hex = COLOR_HEX[color].replace("#", "");
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	const blend = (channel: number) =>
		Math.round(channel + (255 - channel) * mix);
	const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
	return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}
