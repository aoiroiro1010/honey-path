import Svg, {
	Circle,
	Polygon,
	Polyline,
	Text as SvgText,
} from "react-native-svg";
import type { Cell } from "@/game/cell";
import type { Color } from "@/game/color";
import type { HexDir } from "@/game/hex";

import { COLOR_HEX } from "./palette";

const SIZE = 56;
const PAD = 4;
const CX = SIZE + PAD;
const CY = SIZE + PAD;
const DIM = (SIZE + PAD) * 2;
const LINE_WIDTH = SIZE * 0.18;

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
	line?: {
		color: Color;
		dirs: {
			a: HexDir;
			b?: HexDir;
		};
	};
};

function hexPoints(): string {
	return Array.from({ length: 6 }, (_, i) => {
		const angle = ((60 * i - 30) * Math.PI) / 180;
		return `${CX + SIZE * Math.cos(angle)},${CY + SIZE * Math.sin(angle)}`;
	}).join(" ");
}

function edgePoint(dir: HexDir): { x: number; y: number } {
	const angle = (DIR_DEG[dir] * Math.PI) / 180;
	const r = SIZE * (Math.sqrt(3) / 2);
	return {
		x: CX + r * Math.cos(angle),
		y: CY + r * Math.sin(angle),
	};
}

function pointsToString(points: { x: number; y: number }[]): string {
	return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function CellView({ cell, line }: Props) {
	return (
		<Svg width={DIM} height={DIM}>
			<Polygon
				points={hexPoints()}
				fill="#fffbeb"
				stroke="#b45309"
				strokeWidth={2}
			/>
			{cell.dirs ? (
				<Polyline
					points={pointsToString([
						edgePoint(cell.dirs.a),
						{ x: CX, y: CY },
						edgePoint(cell.dirs.b),
					])}
					fill="none"
					stroke="#44403c"
					strokeWidth={LINE_WIDTH}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			) : null}
			{line ? (
				<>
					<Polyline
						points={pointsToString(
							line.dirs.b
								? [
										edgePoint(line.dirs.a),
										{ x: CX, y: CY },
										edgePoint(line.dirs.b),
									]
								: [edgePoint(line.dirs.a), { x: CX, y: CY }],
						)}
						fill="none"
						stroke={COLOR_HEX[line.color]}
						strokeWidth={LINE_WIDTH}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					{line.dirs.b ? null : (
						<Circle
							cx={CX}
							cy={CY}
							r={LINE_WIDTH * 0.7}
							fill={COLOR_HEX[line.color]}
						/>
					)}
				</>
			) : null}
			{cell.start ? (
				<Circle
					cx={CX}
					cy={CY}
					r={SIZE * 0.28}
					fill={COLOR_HEX[cell.start.color]}
				/>
			) : null}
			{cell.goal ? (
				<Circle
					cx={CX}
					cy={CY}
					r={SIZE * 0.28}
					fill="none"
					stroke={COLOR_HEX[cell.goal.color]}
					strokeWidth={SIZE * 0.08}
				/>
			) : null}
			{cell.number ? (
				<SvgText
					x={CX}
					y={CY + SIZE * 0.16}
					textAnchor="middle"
					fontSize={SIZE * 0.42}
					fontWeight="700"
					fill={COLOR_HEX[cell.number.color]}
				>
					{String(cell.number.value)}
				</SvgText>
			) : null}
		</Svg>
	);
}
