import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getLevel } from "@/game/levels";
import { useProgress } from "@/game/progress";
import { BoardView } from "@/ui/BoardView";
import { Button } from "@/ui/Button";

export default function PlayScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const markCleared = useProgress((state) => state.markCleared);
	const level = id ? getLevel(id) : undefined;

	if (!level) {
		return <Redirect href="/levels" />;
	}

	return (
		<View
			className="flex-1 bg-amber-50"
			style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
		>
			<View className="mb-4 flex-row items-center justify-between px-6">
				<Pressable onPress={() => router.replace("/levels")} hitSlop={12}>
					<Text className="text-base text-stone-600">選択へ</Text>
				</Pressable>
				<Text className="font-heading text-xl text-amber-950">
					{level.name}
				</Text>
				<View className="w-12" />
			</View>

			<ScrollView
				contentContainerClassName="flex-grow items-center justify-center px-4 py-6"
				showsVerticalScrollIndicator={false}
			>
				<BoardView board={level.board} />
			</ScrollView>

			<View className="gap-3 px-6">
				<Button
					label="リセット"
					variant="secondary"
					onPress={() => {
						/* 線の操作は次のステップ */
					}}
				/>
				<Button
					label="クリア（仮）"
					onPress={() => {
						markCleared(level.id);
						router.replace({
							pathname: "/clear/[id]",
							params: { id: level.id },
						});
					}}
				/>
			</View>
		</View>
	);
}
