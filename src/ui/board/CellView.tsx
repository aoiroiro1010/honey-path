import { useId } from "react";
import Svg, {
	Circle,
	ClipPath,
	Defs,
	G,
	Polygon,
	Polyline,
	Text as SvgText,
} from "react-native-svg";
import type { Cell } from "@/game/model/cell";
import type { Color } from "@/game/model/color";
import type { HexDir } from "@/game/model/hex";
import { CELL_PAD, CELL_SIZE, CELL_VIEW_SIZE } from "./hexLayout";
import { COLOR_HEX } from "./palette";

const SIZE = CELL_SIZE;
const PAD = CELL_PAD;
const CX = SIZE + PAD;
const CY = SIZE + PAD;
const DIM = CELL_VIEW_SIZE;
const LINE_WIDTH = SIZE * 0.42;
const RAIL_WIDTH = SIZE * 0.08;
const MARK_R = SIZE * 0.58;

const CELL_FILL = "#f4f4f5";
const CELL_STROKE = "#d4d4d8";
const DIRS_STROKE = "#52525b";

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

function pathPoints(a: HexDir, b?: HexDir): { x: number; y: number }[] {
	if (b) {
		return [edgePoint(a), { x: CX, y: CY }, edgePoint(b)];
	}
	return [edgePoint(a), { x: CX, y: CY }];
}

function StartMark({ color }: { color: Color }) {
	return (
		<>
			<Circle cx={CX} cy={CY} r={MARK_R} fill={COLOR_HEX[color]} />
			<SvgText
				x={CX}
				y={CY + SIZE * 0.3}
				textAnchor="middle"
				fontSize={SIZE * 0.85}
				fontWeight="700"
				fill="#ffffff"
			>
				S
			</SvgText>
		</>
	);
}

/** ゴールは輪郭リングでスタートと区別する */
function GoalMark({ color }: { color: Color }) {
	const stroke = SIZE * 0.12;
	return (
		<>
			<Circle
				cx={CX}
				cy={CY}
				r={MARK_R - stroke / 2}
				fill="#ffffff"
				stroke={COLOR_HEX[color]}
				strokeWidth={stroke}
			/>
			<SvgText
				x={CX}
				y={CY + SIZE * 0.3}
				textAnchor="middle"
				fontSize={SIZE * 0.85}
				fontWeight="700"
				fill={COLOR_HEX[color]}
			>
				G
			</SvgText>
		</>
	);
}

function NumberMark({ color, value }: { color: Color; value: number }) {
	return (
		<>
			<Circle cx={CX} cy={CY} r={MARK_R} fill={COLOR_HEX[color]} />
			<SvgText
				x={CX}
				y={CY + SIZE * 0.3}
				textAnchor="middle"
				fontSize={SIZE * 0.85}
				fontWeight="700"
				fill="#ffffff"
			>
				{String(value)}
			</SvgText>
		</>
	);
}

export function CellView({ cell, line }: Props) {
	const clipId = `dirs-${useId().replace(/:/g, "")}`;
	const points = hexPoints();

	return (
		<Svg width={DIM} height={DIM} style={{ userSelect: "none" }}>
			<Defs>
				<ClipPath id={clipId}>
					<Polygon points={points} />
				</ClipPath>
			</Defs>
			<Polygon
				points={points}
				fill={CELL_FILL}
				stroke={CELL_STROKE}
				strokeWidth={1.5}
			/>
			{cell.dirs ? (
				<G clipPath={`url(#${clipId})`}>
					<Polyline
						points={pointsToString([
							edgePoint(cell.dirs.a),
							{ x: CX, y: CY },
							edgePoint(cell.dirs.b),
						])}
						fill="none"
						stroke={DIRS_STROKE}
						strokeWidth={LINE_WIDTH + RAIL_WIDTH * 2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<Polyline
						points={pointsToString([
							edgePoint(cell.dirs.a),
							{ x: CX, y: CY },
							edgePoint(cell.dirs.b),
						])}
						fill="none"
						stroke={CELL_FILL}
						strokeWidth={LINE_WIDTH}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</G>
			) : null}
			{line ? (
				<>
					<Polyline
						points={pointsToString(pathPoints(line.dirs.a, line.dirs.b))}
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
							r={LINE_WIDTH / 2}
							fill={COLOR_HEX[line.color]}
						/>
					)}
				</>
			) : null}
			{cell.start ? <StartMark color={cell.start.color} /> : null}
			{cell.goal ? <GoalMark color={cell.goal.color} /> : null}
			{cell.number ? (
				<NumberMark color={cell.number.color} value={cell.number.value} />
			) : null}
		</Svg>
	);
}
