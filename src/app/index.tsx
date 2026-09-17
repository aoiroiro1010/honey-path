import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/ui/Button";

export default function TitleScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View
			className="flex-1 bg-amber-50 px-8"
			style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}
		>
			<View className="flex-1 items-center justify-center">
				<Text className="font-heading text-5xl text-amber-950">Honey Path</Text>
				<Text className="mt-4 max-w-xs text-center text-base leading-6 text-stone-600">
					色の違う線で、六角形のマスを埋め尽くす一筆書き
				</Text>
			</View>
			<View className="gap-3">
				<Button label="はじめる" onPress={() => router.push("/levels")} />
			</View>
		</View>
	);
}
