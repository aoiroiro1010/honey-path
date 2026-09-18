import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	isLevelUnlocked,
	useProgress,
	visibleLevelNumbers,
} from "@/game/levels";
import { HexLevelTile } from "@/ui/HexLevelTile";

export default function LevelsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const cleared = useProgress((state) => state.cleared);
	const numbers = visibleLevelNumbers(cleared);
	const clearedCount = cleared.length;

	return (
		<View
			className="flex-1 bg-amber-50"
			style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
		>
			<View className="mb-4 flex-row items-center justify-between px-5">
				<Pressable
					onPress={() => router.back()}
					hitSlop={12}
					className="h-11 w-11 items-center justify-center rounded-full bg-white/80"
				>
					<Ionicons name="arrow-back" size={22} color="#57534e" />
				</Pressable>
				<Text className="font-heading text-xl text-amber-950">レベル選択</Text>
				<View className="min-w-11 flex-row items-center justify-end gap-1">
					<Ionicons name="trophy" size={18} color="#d97706" />
					<Text className="font-heading text-base text-amber-800">
						{clearedCount}
					</Text>
				</View>
			</View>

			<ScrollView contentContainerClassName="flex-row flex-wrap justify-center gap-x-2 gap-y-1 px-4 pb-8">
				{numbers.map((n) => {
					const id = String(n);
					const done = cleared.includes(id);
					const unlocked = isLevelUnlocked(id, cleared);
					return (
						<HexLevelTile
							key={id}
							id={id}
							done={done}
							unlocked={unlocked}
							onPress={() =>
								router.push({
									pathname: "/play/[id]",
									params: { id },
								})
							}
						/>
					);
				})}
			</ScrollView>
		</View>
	);
}
