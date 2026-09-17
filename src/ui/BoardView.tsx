import { useMemo, useRef } from "react";
import { View } from "react-native";
import type { Board } from "@/game/board";
import type { Color } from "@/game/color";
import {
	beginAtStart,
	clearLine,
	lineAtCell,
	truncateLine,
	tryExtend,
} from "@/game/draw";
import type { Line } from "@/game/line";

import { CellView } from "./CellView";
import { CELL_SIZE, CELL_VIEW_SIZE, cellToPixel } from "./hexLayout";

type Props = {
	board: Board;
	lines?: Line[];
	onChangeLines?: (lines: Line[]) => void;
};

type DragState = {
	color: Color | null;
	pendingStart: Color | null;
	moved: boolean;
};

export function BoardView({ board, lines, onChangeLines }: Props) {
	const drawn = lines ?? board.lines;
	const interactive = Boolean(onChangeLines);

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

	const linesRef = useRef(drawn);
	linesRef.current = drawn;
	const drag = useRef<DragState>({
		color: null,
		pendingStart: null,
		moved: false,
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

	function apply(next: Line[]) {
		linesRef.current = next;
		onChangeLines?.(next);
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
					apply(truncateLine(current, line.color, index));
					state.color = line.color;
					return;
				}
			}

			if (startColor) {
				state.pendingStart = startColor;
				apply(beginAtStart(board, current, startColor));
				state.color = startColor;
			}
			return;
		}

		if (state.pendingStart) {
			apply(beginAtStart(board, current, state.pendingStart));
			state.color = state.pendingStart;
			state.pendingStart = null;
			state.moved = true;
		}

		if (!state.color) {
			return;
		}

		state.moved = true;
		const extended = tryExtend(board, current, state.color, cell);
		if (extended) {
			apply(extended);
		}
	}

	function onRelease() {
		const state = drag.current;
		if (state.pendingStart && !state.moved) {
			apply(clearLine(linesRef.current, state.pendingStart));
		}
		state.color = null;
		state.pendingStart = null;
		state.moved = false;
	}

	return (
		<View
			style={{
				width: positions.width,
				height: positions.height,
				userSelect: "none",
			}}
			onStartShouldSetResponder={() => interactive}
			onMoveShouldSetResponder={() => interactive}
			onResponderTerminationRequest={() => false}
			onResponderGrant={
				interactive
					? (event) => {
							if (typeof window !== "undefined") {
								window.getSelection()?.removeAllRanges();
							}
							const cell = hitCell(
								event.nativeEvent.locationX,
								event.nativeEvent.locationY,
							);
							if (cell) {
								onTouchCell(cell, true);
							}
						}
					: undefined
			}
			onResponderMove={
				interactive
					? (event) => {
							const cell = hitCell(
								event.nativeEvent.locationX,
								event.nativeEvent.locationY,
							);
							if (cell) {
								onTouchCell(cell, false);
							}
						}
					: undefined
			}
			onResponderRelease={interactive ? onRelease : undefined}
			onResponderTerminate={interactive ? onRelease : undefined}
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
					<CellView cell={cell} line={lineAtCell(drawn, cell.x, cell.y)} />
				</View>
			))}
		</View>
	);
}
