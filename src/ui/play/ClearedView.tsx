import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import type { Board } from "@/game/model/board";
import type { Line } from "@/game/model/line";
import { Button } from "../Button";
import { BoardView } from "../board";
import { theme } from "../theme";
import { Confetti } from "./Confetti";

const STAR_IDS = ["star-a", "star-b", "star-c"] as const;

type Props = {
	board: Board;
	lines: Line[];
	levelName: string;
	opacity: Animated.Value;
	onNext: () => void;
	onLevels: () => void;
};

export function ClearedView({
	board,
	lines,
	levelName,
	opacity,
	onNext,
	onLevels,
}: Props) {
	const crownY = useRef(new Animated.Value(-8)).current;
	const crownOpacity = useRef(new Animated.Value(0)).current;
	const titleScale = useRef(new Animated.Value(0.85)).current;
	const titleOpacity = useRef(new Animated.Value(0)).current;
	const subtitleOpacity = useRef(new Animated.Value(0)).current;
	const starScales = useRef(STAR_IDS.map(() => new Animated.Value(0))).current;
	const actionsY = useRef(new Animated.Value(10)).current;
	const actionsOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// ほぼ同時に出し、ボタン待ちをなくす
		Animated.parallel([
			Animated.timing(crownOpacity, {
				toValue: 1,
				duration: 160,
				useNativeDriver: true,
			}),
			Animated.timing(crownY, {
				toValue: 0,
				duration: 160,
				useNativeDriver: true,
			}),
			Animated.timing(titleOpacity, {
				toValue: 1,
				duration: 160,
				useNativeDriver: true,
			}),
			Animated.spring(titleScale, {
				toValue: 1,
				friction: 6,
				tension: 140,
				useNativeDriver: true,
			}),
			Animated.timing(subtitleOpacity, {
				toValue: 1,
				duration: 180,
				useNativeDriver: true,
			}),
			...starScales.map((scale, i) =>
				Animated.sequence([
					Animated.delay(i * 50),
					Animated.spring(scale, {
						toValue: 1,
						friction: 5,
						tension: 160,
						useNativeDriver: true,
					}),
				]),
			),
			Animated.timing(actionsOpacity, {
				toValue: 1,
				duration: 180,
				useNativeDriver: true,
			}),
			Animated.timing(actionsY, {
				toValue: 0,
				duration: 180,
				useNativeDriver: true,
			}),
		]).start();
	}, [
		actionsOpacity,
		actionsY,
		crownOpacity,
		crownY,
		starScales,
		subtitleOpacity,
		titleOpacity,
		titleScale,
	]);

	return (
		<Animated.View style={{ flex: 1, opacity }}>
			<Confetti />

			<View className="items-center px-6 pt-4">
				<Animated.View
					style={{
						opacity: crownOpacity,
						transform: [{ translateY: crownY }],
					}}
				>
					<MaterialCommunityIcons
						name="crown"
						size={36}
						color={theme.icon.star}
					/>
				</Animated.View>

				<Animated.Text
					className="mt-2 font-heading text-5xl text-amber-300"
					style={{
						opacity: titleOpacity,
						transform: [{ scale: titleScale }],
						textShadowColor: "rgba(251, 191, 36, 0.45)",
						textShadowOffset: { width: 0, height: 2 },
						textShadowRadius: 10,
					}}
				>
					CLEAR!
				</Animated.Text>

				<Animated.Text
					className="mt-1 text-base text-white/90"
					style={{ opacity: subtitleOpacity }}
				>
					{levelName}
				</Animated.Text>
			</View>

			<View className="w-full flex-1 px-4">
				<BoardView board={board} lines={lines} />
			</View>

			<Animated.View
				className="items-center gap-3 px-6"
				style={{
					opacity: actionsOpacity,
					transform: [{ translateY: actionsY }],
				}}
			>
				<View className="mb-1 flex-row gap-3">
					{STAR_IDS.map((id, i) => {
						const scale = starScales[i];
						if (!scale) {
							return null;
						}
						return (
							<Animated.View key={id} style={{ transform: [{ scale }] }}>
								<Ionicons name="star" size={32} color={theme.icon.star} />
							</Animated.View>
						);
					})}
				</View>
				<View className="w-full gap-3">
					<Button
						label="次のレベル"
						iconRight="chevron-forward"
						onPress={onNext}
					/>
					<Button
						label="レベル選択に戻る"
						variant="secondary"
						iconLeft="home-outline"
						onPress={onLevels}
					/>
				</View>
			</Animated.View>
		</Animated.View>
	);
}
