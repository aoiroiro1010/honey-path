import { View } from "react-native";
import type { Board } from "@/game/model/board";
import type { Line } from "@/game/model/line";
import { Button } from "../Button";
import { BoardView } from "../board";
import { PathProgress } from "../PathProgress";
import { ScreenHeader } from "../ScreenHeader";

type Props = {
	board: Board;
	lines: Line[];
	title: string;
	onChangeLines: (lines: Line[]) => void;
	onBack: () => void;
	onReset: () => void;
};

export function PlayingView({
	board,
	lines,
	title,
	onChangeLines,
	onBack,
	onReset,
}: Props) {
	return (
		<View className="flex-1">
			<ScreenHeader title={title} onBack={onBack} onReset={onReset} />
			<PathProgress board={board} lines={lines} />
			<View className="w-full flex-1 px-4">
				<BoardView board={board} lines={lines} onChangeLines={onChangeLines} />
			</View>
			<View className="px-6">
				<Button
					label="リセット"
					variant="secondary"
					iconLeft="backspace-outline"
					onPress={onReset}
				/>
			</View>
		</View>
	);
}
