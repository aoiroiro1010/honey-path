import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, Screen } from "@/ui";
import { COLOR_HEX } from "@/ui/board/palette";
import { theme } from "@/ui/theme";

const LOGO_COLORS = [
	COLOR_HEX.green,
	COLOR_HEX.blue,
	COLOR_HEX.orange,
] as const;

export default function TitleScreen() {
	const router = useRouter();

	return (
		<Screen spacious className="px-8">
			<View className="flex-1 items-center justify-center">
				<View className="mb-5 flex-row gap-2">
					{LOGO_COLORS.map((color) => (
						<View
							key={color}
							className="h-5 w-5 rotate-[30deg] rounded-md"
							style={{ backgroundColor: color }}
						/>
					))}
				</View>
				<Text className="font-heading text-5xl text-amber-950">Honey Path</Text>
				<Text className="mt-4 max-w-xs text-center text-base leading-6 text-stone-600">
					色の違う線で、六角形のマスを埋め尽くす一筆書き
				</Text>
				<View className="mt-8 opacity-80">
					<Ionicons name="grid-outline" size={56} color={theme.icon.accent} />
				</View>
			</View>
			<View className="gap-3">
				<Button
					label="はじめる"
					iconRight="chevron-forward"
					onPress={() => router.push("/levels")}
				/>
				<Button
					label="生成テスト"
					variant="secondary"
					iconLeft="flask-outline"
					onPress={() => router.push("/lab")}
				/>
			</View>
		</Screen>
	);
}
