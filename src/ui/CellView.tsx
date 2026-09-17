import Svg, {
	Circle,
	Polygon,
	Polyline,
	Text as SvgText,
} from "react-native-svg";
import type { Cell } from "@/game/cell";
import type { HexDir } from "@/game/hex";

import { COLOR_HEX } from "./palette";

const DIR_DEG: Record<HexDir, number> = {
	R: 0,
	BR: 60,
	BL: 120,
	L: 180,
	TL: 240,
	TR: 300,
};

type Props = {
	cell: Cell;
	size?: number;
};

function hexPoints(cx: number, cy: number, size: number): string {
	return Array.from({ length: 6 }, (_, i) => {
		const angle = ((60 * i - 30) * Math.PI) / 180;
		return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
	}).join(" ");
}

function edgePoint(
	cx: number,
	cy: number,
	size: number,
	dir: HexDir,
): { x: number; y: number } {
	const angle = (DIR_DEG[dir] * Math.PI) / 180;
	const r = size * (Math.sqrt(3) / 2);
	return {
		x: cx + r * Math.cos(angle),
		y: cy + r * Math.sin(angle),
	};
}

export function CellView({ cell, size = 56 }: Props) {
	const pad = 4;
	const cx = size + pad;
	const cy = size + pad;
	const dim = (size + pad) * 2;

	return (
		<Svg width={dim} height={dim}>
			<Polygon
				points={hexPoints(cx, cy, size)}
				fill="#fffbeb"
				stroke="#b45309"
				strokeWidth={2}
			/>
			{cell.dirs ? (
				<Polyline
					points={[
						edgePoint(cx, cy, size, cell.dirs.a),
						{ x: cx, y: cy },
						edgePoint(cx, cy, size, cell.dirs.b),
					]
						.map((p) => `${p.x},${p.y}`)
						.join(" ")}
					fill="none"
					stroke="#44403c"
					strokeWidth={size * 0.18}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			) : null}
			{cell.start ? (
				<Circle
					cx={cx}
					cy={cy}
					r={size * 0.28}
					fill={COLOR_HEX[cell.start.color]}
				/>
			) : null}
			{cell.goal ? (
				<Circle
					cx={cx}
					cy={cy}
					r={size * 0.28}
					fill="none"
					stroke={COLOR_HEX[cell.goal.color]}
					strokeWidth={size * 0.08}
				/>
			) : null}
			{cell.number ? (
				<SvgText
					x={cx}
					y={cy + size * 0.16}
					textAnchor="middle"
					fontSize={size * 0.42}
					fontWeight="700"
					fill={COLOR_HEX[cell.number.color]}
				>
					{String(cell.number.value)}
				</SvgText>
			) : null}
		</Svg>
	);
}
