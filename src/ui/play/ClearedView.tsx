import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Animated, Text, View } from "react-native";
import type { Board } from "@/game/model/board";
import type { Line } from "@/game/model/line";
import { Button } from "../Button";
import { BoardView } from "../board";
import { theme } from "../theme";

type Props = {
	board: Board;
	lines: Line[];
	levelName: string;
	opacity: Animated.Value;
	onNext: () => void;
	onLevels: () => void;
};

export function ClearedView({
	board,
	lines,
	levelName,
	opacity,
	onNext,
	onLevels,
}: Props) {
	return (
		<Animated.View style={{ flex: 1, opacity }}>
			<View className="items-center px-6 pt-4">
				<MaterialCommunityIcons
					name="crown"
					size={32}
					color={theme.icon.star}
				/>
				<Text className="mt-2 font-heading text-5xl text-amber-300">
					CLEAR!
				</Text>
				<Text className="mt-1 text-base text-white">{levelName}</Text>
			</View>

			<View className="w-full flex-1 px-4">
				<BoardView board={board} lines={lines} />
			</View>

			<View className="items-center gap-3 px-6">
				<View className="mb-1 flex-row gap-3">
					{[0, 1, 2].map((i) => (
						<Ionicons key={i} name="star" size={30} color={theme.icon.star} />
					))}
				</View>
				<View className="w-full gap-3">
					<Button
						label="次のレベル"
						iconRight="chevron-forward"
						onPress={onNext}
					/>
					<Button
						label="レベル選択に戻る"
						variant="secondary"
						iconLeft="home-outline"
						onPress={onLevels}
					/>
				</View>
			</View>
		</Animated.View>
	);
}
