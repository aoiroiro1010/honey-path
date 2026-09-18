import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/ui/Button";
import { COLOR_HEX } from "@/ui/board/palette";

const LOGO_COLORS = [
	COLOR_HEX.green,
	COLOR_HEX.blue,
	COLOR_HEX.orange,
] as const;

export default function TitleScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View
			className="flex-1 bg-amber-50 px-8"
			style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}
		>
			<View className="flex-1 items-center justify-center">
				<View className="mb-5 flex-row gap-2">
					{LOGO_COLORS.map((color) => (
						<View
							key={color}
							className="h-5 w-5 rounded-md"
							style={{
								backgroundColor: color,
								transform: [{ rotate: "30deg" }],
							}}
						/>
					))}
				</View>
				<Text className="font-heading text-5xl text-amber-950">Honey Path</Text>
				<Text className="mt-4 max-w-xs text-center text-base leading-6 text-stone-600">
					色の違う線で、六角形のマスを埋め尽くす一筆書き
				</Text>
				<View className="mt-8 opacity-80">
					<Ionicons name="grid-outline" size={56} color="#d97706" />
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
		</View>
	);
}
