import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getLevel, nextLevelId } from "@/game/levels";
import { Button } from "@/ui/Button";
import { BoardView } from "@/ui/board";

export default function ClearScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const level = id ? getLevel(id) : undefined;
	const nextId = id ? nextLevelId(id) : "1";

	if (!level) {
		return <Redirect href="/levels" />;
	}

	return (
		<View
			className="flex-1 bg-slate-900 px-6"
			style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}
		>
			<View className="items-center">
				<Text className="font-heading text-5xl text-amber-300">CLEAR!</Text>
				<Text className="mt-2 text-lg text-amber-100">{level.name}</Text>
			</View>

			<View className="flex-1 items-center justify-center py-8">
				<View className="scale-75">
					<BoardView board={level.board} />
				</View>
			</View>

			<View className="gap-3">
				<Button
					label="次のレベル"
					onPress={() =>
						router.replace({
							pathname: "/play/[id]",
							params: { id: nextId },
						})
					}
				/>
				<Button
					label="レベル選択に戻る"
					variant="secondary"
					onPress={() => router.replace("/levels")}
				/>
			</View>
		</View>
	);
}
