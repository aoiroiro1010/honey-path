import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LEVELS } from "@/game/levels";
import { useProgress } from "@/game/progress";

export default function LevelsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const cleared = useProgress((state) => state.cleared);
	const clearedCount = cleared.length;

	return (
		<View
			className="flex-1 bg-amber-50 px-6"
			style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
		>
			<View className="mb-8 flex-row items-center justify-between">
				<Pressable onPress={() => router.back()} hitSlop={12}>
					<Text className="text-base text-stone-600">戻る</Text>
				</Pressable>
				<Text className="font-heading text-xl text-amber-950">レベル選択</Text>
				<Text className="text-base text-amber-800">
					{clearedCount}/{LEVELS.length}
				</Text>
			</View>

			<View className="flex-row flex-wrap justify-center gap-4">
				{LEVELS.map((level) => {
					const done = cleared.includes(level.id);
					return (
						<Pressable
							key={level.id}
							onPress={() =>
								router.push({
									pathname: "/play/[id]",
									params: { id: level.id },
								})
							}
							className={`h-20 w-20 items-center justify-center rounded-2xl ${
								done ? "bg-amber-300" : "border border-stone-300 bg-white"
							}`}
						>
							<Text
								className={`font-heading text-2xl ${
									done ? "text-amber-950" : "text-stone-700"
								}`}
							>
								{level.id}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
