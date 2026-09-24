import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import {
	isLevelUnlocked,
	useProgress,
	visibleLevelNumbers,
} from "@/game/levels";
import { BgmToggle, HexLevelTile, Screen, ScreenHeader } from "@/ui";
import { theme } from "@/ui/theme";

export default function LevelsScreen() {
	const router = useRouter();
	const cleared = useProgress((state) => state.cleared);
	const numbers = visibleLevelNumbers(cleared);
	const clearedCount = cleared.length;

	return (
		<Screen>
			<ScreenHeader
				title="レベル選択"
				onBack={() => router.dismissTo("/")}
				trailing={
					<View className="min-w-11 flex-row items-center justify-end gap-2">
						<View className="flex-row items-center gap-1">
							<Ionicons name="trophy" size={18} color={theme.icon.accent} />
							<Text className="font-heading text-base text-amber-800">
								{clearedCount}
							</Text>
						</View>
						<BgmToggle />
					</View>
				}
			/>

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
		</Screen>
	);
}
