import { Text, View } from "react-native";
import type { Board } from "@/game/model/board";
import type { Line } from "@/game/model/line";
import { COLOR_HEX } from "./board/palette";

type Props = {
	board: Board;
	lines: Line[];
};

export function PathProgress({ board, lines }: Props) {
	const items = board.solution.map((path) => {
		const current =
			lines.find((line) => line.color === path.color)?.coords.length ?? 0;
		const total = Math.max(1, path.coords.length);
		return {
			color: path.color,
			current: Math.min(current, total),
			total,
			hex: COLOR_HEX[path.color],
		};
	});

	if (items.length === 0) {
		return null;
	}

	return (
		<View className="mb-3 flex-row flex-wrap items-center justify-center gap-3 px-4">
			{items.map((item) => (
				<View key={item.color} className="flex-row items-center gap-1.5">
					<View
						className="h-3.5 w-3.5 rounded-full"
						style={{ backgroundColor: item.hex }}
					/>
					<Text className="font-heading text-sm text-stone-600">
						{item.current}/{item.total}
					</Text>
				</View>
			))}
		</View>
	);
}
