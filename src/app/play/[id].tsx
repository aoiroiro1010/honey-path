import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isBoardCleared, linesFromBoard } from "@/game/draw";
import { getLevel, useProgress } from "@/game/levels";
import { Button } from "@/ui/Button";
import { BoardView } from "@/ui/board";
import { hapticSuccess } from "@/ui/haptics";

export default function PlayScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const markCleared = useProgress((state) => state.markCleared);
	const level = id ? getLevel(id) : undefined;
	const [lines, setLines] = useState(() =>
		level ? linesFromBoard(level.board) : [],
	);
	const clearedOnce = useRef(false);

	useEffect(() => {
		clearedOnce.current = false;
		if (level) {
			setLines(linesFromBoard(level.board));
		}
	}, [level]);

	useEffect(() => {
		if (!level || clearedOnce.current) {
			return;
		}
		if (!isBoardCleared(level.board, lines)) {
			return;
		}
		clearedOnce.current = true;
		hapticSuccess();
		markCleared(level.id);
		router.replace({
			pathname: "/clear/[id]",
			params: { id: level.id },
		});
	}, [lines, level, markCleared, router]);

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

			<View
				className="flex-1 items-center justify-center px-4"
				style={{ userSelect: "none" }}
			>
				<BoardView board={level.board} lines={lines} onChangeLines={setLines} />
			</View>

			<View className="px-6">
				<Button
					label="リセット"
					variant="secondary"
					onPress={() => setLines(linesFromBoard(level.board))}
				/>
			</View>
		</View>
	);
}
