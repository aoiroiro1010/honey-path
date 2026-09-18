import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isBoardCleared, linesFromBoard } from "@/game/draw";
import { getLevel, nextLevelId, useProgress } from "@/game/levels";
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
		Animated.spring(clearAnim, {
			toValue: 1,
			friction: 7,
			tension: 60,
			useNativeDriver: true,
		}).start();
	}, [lines, level, markCleared, clearAnim]);

	if (!level) {
		return <Redirect href="/levels" />;
	}

	const nextId = nextLevelId(level.id);

	return (
		<View
			className="flex-1 bg-amber-50"
			style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
		>
			<View className="mb-4 flex-row items-center justify-between px-6">
				<Pressable
					onPress={() => router.replace("/levels")}
					hitSlop={12}
					disabled={cleared}
				>
					<Text
						className={`text-base ${cleared ? "text-stone-300" : "text-stone-600"}`}
					>
						選択へ
					</Text>
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
				<BoardView
					board={level.board}
					lines={lines}
					onChangeLines={cleared ? undefined : setLines}
				/>
			</View>

			{!cleared ? (
				<View className="px-6">
					<Button
						label="リセット"
						variant="secondary"
						onPress={() => setLines(linesFromBoard(level.board))}
					/>
				</View>
			) : null}

			{cleared ? (
				<Animated.View
					pointerEvents="box-none"
					style={[
						StyleSheet.absoluteFill,
						{
							opacity: clearAnim,
							paddingTop: insets.top + 12,
							paddingBottom: insets.bottom + 16,
						},
					]}
				>
					<View
						pointerEvents="none"
						style={styles.clearBanner}
					>
						<Animated.View
							style={{
								transform: [
									{
										scale: clearAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [0.85, 1],
										}),
									},
								],
							}}
							className="items-center rounded-3xl bg-amber-50/90 px-10 py-6"
						>
							<Text className="font-heading text-5xl text-amber-700">
								CLEAR!
							</Text>
							<Text className="mt-1 text-base text-stone-600">
								{level.name}
							</Text>
						</Animated.View>
					</View>

					<View style={styles.clearActions} className="px-6">
						<View className="gap-3">
							<Button
								label="次のレベル"
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
								onPress={() => router.replace("/levels")}
							/>
						</View>
					</View>
				</Animated.View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	clearBanner: {
		...StyleSheet.absoluteFill,
		alignItems: "center",
		justifyContent: "center",
	},
	clearActions: {
		marginTop: "auto",
	},
});
