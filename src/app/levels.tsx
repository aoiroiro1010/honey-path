import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	isLevelUnlocked,
	useProgress,
	visibleLevelNumbers,
} from "@/game/levels";

export default function LevelsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const cleared = useProgress((state) => state.cleared);
	const numbers = visibleLevelNumbers(cleared);
	const clearedCount = cleared.length;

	return (
		<View
			className="flex-1 bg-amber-50"
			style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
		>
			<View className="mb-6 flex-row items-center justify-between px-6">
				<Pressable onPress={() => router.back()} hitSlop={12}>
					<Text className="text-base text-stone-600">戻る</Text>
				</Pressable>
				<Text className="font-heading text-xl text-amber-950">レベル選択</Text>
				<Text className="text-base text-amber-800">{clearedCount}</Text>
			</View>

			<ScrollView contentContainerClassName="flex-row flex-wrap justify-center gap-4 px-6 pb-8">
				{numbers.map((n) => {
					const id = String(n);
					const done = cleared.includes(id);
					const unlocked = isLevelUnlocked(id, cleared);
					return (
						<Pressable
							key={id}
							disabled={!unlocked}
							onPress={() =>
								router.push({
									pathname: "/play/[id]",
									params: { id },
								})
							}
							className={`h-20 w-20 items-center justify-center rounded-2xl ${
								done
									? "bg-amber-300"
									: unlocked
										? "border border-stone-300 bg-white"
										: "bg-stone-200"
							}`}
						>
							<Text
								className={`font-heading text-2xl ${
									done
										? "text-amber-950"
										: unlocked
											? "text-stone-700"
											: "text-stone-400"
								}`}
							>
								{id}
							</Text>
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}
