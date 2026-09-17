import { View } from "react-native";
import type { Board } from "@/game/board";

import { CellView } from "./CellView";
import { CELL_VIEW_SIZE, cellToPixel } from "./hexLayout";

type Props = {
	board: Board;
};

export function BoardView({ board }: Props) {
	const positions = board.cells.map((cell) => ({
		cell,
		...cellToPixel(cell.x, cell.y),
	}));

	const minLeft = Math.min(...positions.map((p) => p.left));
	const maxLeft = Math.max(...positions.map((p) => p.left));
	const minTop = Math.min(...positions.map((p) => p.top));
	const maxTop = Math.max(...positions.map((p) => p.top));

	const width = maxLeft - minLeft + CELL_VIEW_SIZE;
	const height = maxTop - minTop + CELL_VIEW_SIZE;

	return (
		<View style={{ width, height }}>
			{positions.map(({ cell, left, top }) => (
				<View
					key={`${cell.x},${cell.y}`}
					style={{
						position: "absolute",
						left: left - minLeft,
						top: top - minTop,
						width: CELL_VIEW_SIZE,
						height: CELL_VIEW_SIZE,
					}}
				>
					<CellView cell={cell} />
				</View>
			))}
		</View>
	);
}
