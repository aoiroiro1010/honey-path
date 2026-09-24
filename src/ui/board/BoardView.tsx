import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import type { Board } from "@/game/model/board";
import type { Color } from "@/game/model/color";
import type { Line } from "@/game/model/line";
import {
	beginAtStart,
	clearLine,
	lineAtCell,
	occupantAt,
	truncateLine,
	tryExtend,
} from "@/game/play";
import { hapticBlocked, hapticCell, hapticClear } from "../haptics";
import { CellView } from "./CellView";
import { CELL_SIZE, CELL_VIEW_SIZE, cellToPixel } from "./hexLayout";

type Props = {
	board: Board;
	lines: Line[];
	onChangeLines?: (lines: Line[]) => void;
};

type DragState = {
	color: Color | null;
	pendingStart: Color | null;
	moved: boolean;
	blockedKey: string | null;
};

function lineLength(lines: Line[], color: Color): number {
	return lines.find((line) => line.color === color)?.coords.length ?? 0;
}

export function BoardView({ board, lines, onChangeLines }: Props) {
	const drawn = lines;
	const interactive = Boolean(onChangeLines);
	const [avail, setAvail] = useState({ width: 0, height: 0 });

	const positions = useMemo(() => {
		const items = board.cells.map((cell) => ({
			cell,
			...cellToPixel(cell.x, cell.y),
		}));
		const minLeft = Math.min(...items.map((p) => p.left));
		const maxLeft = Math.max(...items.map((p) => p.left));
		const minTop = Math.min(...items.map((p) => p.top));
		const maxTop = Math.max(...items.map((p) => p.top));
		return {
			items: items.map((item) => ({
				...item,
				left: item.left - minLeft,
				top: item.top - minTop,
			})),
			width: maxLeft - minLeft + CELL_VIEW_SIZE,
			height: maxTop - minTop + CELL_VIEW_SIZE,
		};
	}, [board.cells]);

	// はみ出すときだけ縮小。小さい盤は実寸のまま
	const scale =
		avail.width > 0 && avail.height > 0
			? Math.min(
					1,
					avail.width / positions.width,
					avail.height / positions.height,
				)
			: 1;

	const linesRef = useRef(drawn);
	linesRef.current = drawn;
	const drag = useRef<DragState>({
		color: null,
		pendingStart: null,
		moved: false,
		blockedKey: null,
	});

	function hitCell(touchX: number, touchY: number) {
		let best: (typeof positions.items)[number] | undefined;
		let bestDist = CELL_SIZE * CELL_SIZE;
		for (const item of positions.items) {
			const cx = item.left + CELL_VIEW_SIZE / 2;
			const cy = item.top + CELL_VIEW_SIZE / 2;
			const dx = touchX - cx;
			const dy = touchY - cy;
			const dist = dx * dx + dy * dy;
			if (dist < bestDist) {
				bestDist = dist;
				best = item;
			}
		}
		return best?.cell;
	}

	function apply(next: Line[], kind: "cell" | "clear" | "silent" = "silent") {
		linesRef.current = next;
		onChangeLines?.(next);
		if (kind === "cell") {
			hapticCell();
		} else if (kind === "clear") {
			hapticClear();
		}
	}

	function onTouchCell(cell: { x: number; y: number }, isDown: boolean) {
		const current = linesRef.current;
		const state = drag.current;

		if (isDown) {
			state.moved = false;
			state.color = null;
			state.pendingStart = null;

			const startColor = board.cells.find(
				(c) => c.x === cell.x && c.y === cell.y,
			)?.start?.color;

			for (const line of current) {
				const index = line.coords.findIndex(
					(c) => c.x === cell.x && c.y === cell.y,
				);
				if (index >= 0) {
					if (startColor === line.color && index === 0) {
						state.pendingStart = line.color;
						return;
					}
					const before = line.coords.length;
					const next = truncateLine(current, line.color, index);
					apply(
						next,
						lineLength(next, line.color) < before ? "clear" : "silent",
					);
					state.color = line.color;
					return;
				}
			}

			if (startColor) {
				state.pendingStart = startColor;
				apply(beginAtStart(board, current, startColor), "cell");
				state.color = startColor;
			}
			return;
		}

		if (state.pendingStart) {
			apply(beginAtStart(board, current, state.pendingStart), "cell");
			state.color = state.pendingStart;
			state.pendingStart = null;
			state.moved = true;
		}

		if (!state.color) {
			return;
		}

		state.moved = true;
		const color = state.color;
		const before = lineLength(current, color);
		const extended = tryExtend(board, current, color, cell);
		if (extended && lineLength(extended, color) > before) {
			state.blockedKey = null;
			apply(extended, "cell");
		} else if (extended) {
			apply(extended, "silent");
		} else {
			const key = `${cell.x},${cell.y}`;
			if (state.blockedKey !== key) {
				state.blockedKey = key;
				hapticBlocked();
			}
		}
	}

	function onRelease() {
		const state = drag.current;
		if (state.pendingStart && !state.moved) {
			apply(clearLine(linesRef.current, state.pendingStart), "clear");
		}
		state.color = null;
		state.pendingStart = null;
		state.moved = false;
		state.blockedKey = null;
	}

	function touchToBoard(locationX: number, locationY: number) {
		return {
			x: scale > 0 ? locationX / scale : locationX,
			y: scale > 0 ? locationY / scale : locationY,
		};
	}

	return (
		<View
			className="w-full flex-1 items-center justify-center"
			onLayout={(event) => {
				const { width, height } = event.nativeEvent.layout;
				setAvail((prev) =>
					prev.width === width && prev.height === height
						? prev
						: { width, height },
				);
			}}
		>
			<View
				style={{
					width: positions.width * scale,
					height: positions.height * scale,
					userSelect: "none",
				}}
				onStartShouldSetResponder={() => interactive}
				onMoveShouldSetResponder={() => interactive}
				onResponderTerminationRequest={() => false}
				onResponderGrant={
					interactive
						? (event) => {
								window.getSelection?.()?.removeAllRanges();
								const { x, y } = touchToBoard(
									event.nativeEvent.locationX,
									event.nativeEvent.locationY,
								);
								const cell = hitCell(x, y);
								if (cell) {
									onTouchCell(cell, true);
								}
							}
						: undefined
				}
				onResponderMove={
					interactive
						? (event) => {
								const { x, y } = touchToBoard(
									event.nativeEvent.locationX,
									event.nativeEvent.locationY,
								);
								const cell = hitCell(x, y);
								if (cell) {
									onTouchCell(cell, false);
								}
							}
						: undefined
				}
				onResponderRelease={interactive ? onRelease : undefined}
				onResponderTerminate={interactive ? onRelease : undefined}
			>
				<View
					pointerEvents="none"
					style={{
						width: positions.width,
						height: positions.height,
						transform: [{ scale }],
						marginLeft: (positions.width * (scale - 1)) / 2,
						marginTop: (positions.height * (scale - 1)) / 2,
					}}
				>
					{positions.items.map(({ cell, left, top }) => (
						<View
							key={`${cell.x},${cell.y}`}
							pointerEvents="none"
							style={{
								position: "absolute",
								left,
								top,
								width: CELL_VIEW_SIZE,
								height: CELL_VIEW_SIZE,
							}}
						>
							<CellView
								cell={cell}
								line={lineAtCell(drawn, cell.x, cell.y)}
								occupant={occupantAt(drawn, cell.x, cell.y)}
							/>
						</View>
					))}
				</View>
			</View>
		</View>
	);
}
