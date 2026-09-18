import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isBoardCleared, linesFromBoard } from "@/game/draw";
import { getLevel, nextLevelId, useProgress } from "@/game/levels";
import { Button, IconButton } from "@/ui/Button";
import { BoardView } from "@/ui/board";
import { hapticSuccess } from "@/ui/haptics";
import { PathProgress } from "@/ui/PathProgress";

export default function PlayScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const markCleared = useProgress((state) => state.markCleared);
	const level = id ? getLevel(id) : undefined;
	const [lines, setLines] = useState(() =>
		level ? linesFromBoard(level.board) : [],
	);
	const [cleared, setCleared] = useState(false);
	const clearedOnce = useRef(false);
	const clearAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		clearedOnce.current = false;
		setCleared(false);
		clearAnim.setValue(0);
		if (level) {
			setLines(linesFromBoard(level.board));
		}
	}, [level, clearAnim]);

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
		setCleared(true);
		Animated.timing(clearAnim, {
			toValue: 1,
			duration: 280,
			useNativeDriver: true,
		}).start();
	}, [lines, level, markCleared, clearAnim]);

	if (!level) {
		return <Redirect href="/levels" />;
	}

	const nextId = nextLevelId(level.id);
	const reset = () => setLines(linesFromBoard(level.board));
	const pad = {
		paddingTop: insets.top + 8,
		paddingBottom: insets.bottom + 12,
	};

	if (cleared) {
		return (
			<View className="flex-1 bg-[#1e3a5f]" style={pad}>
				<Animated.View style={{ flex: 1, opacity: clearAnim }}>
					<View className="flex-1">
						<View className="items-center px-6 pt-4">
							<MaterialCommunityIcons name="crown" size={32} color="#fbbf24" />
							<Text className="mt-2 font-heading text-5xl text-amber-300">
								CLEAR!
							</Text>
							<Text className="mt-1 text-base text-white">{level.name}</Text>
						</View>

						<View
							className="flex-1 items-center justify-center px-4"
							style={{ userSelect: "none" }}
						>
							<BoardView board={level.board} lines={lines} />
						</View>

						<View className="items-center gap-3 px-6">
							<View className="mb-1 flex-row gap-3">
								{[0, 1, 2].map((i) => (
									<Ionicons key={i} name="star" size={30} color="#fbbf24" />
								))}
							</View>
							<View className="w-full gap-3">
								<Button
									label="次のレベル"
									iconRight="chevron-forward"
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
									iconLeft="home-outline"
									onPress={() => router.replace("/levels")}
								/>
							</View>
						</View>
					</View>
				</Animated.View>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-amber-50" style={pad}>
			<View className="mb-2 flex-row items-center justify-between px-4">
				<IconButton
					name="arrow-back"
					accessibilityLabel="レベル選択へ"
					onPress={() => router.replace("/levels")}
				/>
				<Text className="font-heading text-xl text-amber-950">
					{level.name}
				</Text>
				<IconButton
					name="refresh"
					accessibilityLabel="リセット"
					onPress={reset}
				/>
			</View>

			<PathProgress board={level.board} lines={lines} />

			<View
				className="flex-1 items-center justify-center px-4"
				style={{ userSelect: "none" }}
			>
				<BoardView
					board={level.board}
					lines={lines}
					onChangeLines={setLines}
				/>
			</View>

			<View className="px-6">
				<Button
					label="リセット"
					variant="secondary"
					iconLeft="backspace-outline"
					onPress={reset}
				/>
			</View>
		</View>
	);
}
