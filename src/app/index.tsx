import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import {
	Animated,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Ellipse, Path, Polygon } from "react-native-svg";
import { BgmToggle } from "@/ui/BgmToggle";
import { Button } from "@/ui/Button";
import { COLOR_HEX } from "@/ui/board/palette";
import { hapticPress } from "@/ui/haptics";
import { theme } from "@/ui/theme";

const BG = require("../../assets/images/background.png");

export default function TitleScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const fade = useState(() => new Animated.Value(0))[0];
	const beeY = useState(() => new Animated.Value(0))[0];

	useEffect(() => {
		Animated.timing(fade, {
			toValue: 1,
			duration: 700,
			useNativeDriver: true,
		}).start();
		const bob = Animated.loop(
			Animated.sequence([
				Animated.timing(beeY, {
					toValue: -8,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(beeY, {
					toValue: 0,
					duration: 1000,
					useNativeDriver: true,
				}),
			]),
		);
		bob.start();
		return () => bob.stop();
	}, [beeY, fade]);

	return (
		<View className="flex-1 bg-sky-200">
			<Image
				source={BG}
				style={StyleSheet.absoluteFill}
				contentFit="cover"
				priority="high"
			/>

			<Animated.View
				className="flex-1 px-8"
				style={{
					opacity: fade,
					paddingTop: insets.top + 28,
					paddingBottom: insets.bottom + 28,
				}}
			>
				<View className="flex-1 items-center justify-center">
					<View className="mb-3 flex-row items-center">
						<HexCluster />
						<Text
							className="ml-2 font-heading text-5xl text-amber-950"
							style={styles.titleShadow}
						>
							Honey Path
						</Text>
						<Animated.View
							className="ml-1.5 mb-6"
							style={{ transform: [{ translateY: beeY }] }}
						>
							<BeeMark />
						</Animated.View>
					</View>

					<Text
						className="mt-2 text-center font-heading text-base leading-7 text-amber-950/90"
						style={styles.titleShadow}
					>
						{"六角形のマスを、\n色の違う線で埋め尽くす\n一筆書きパズル"}
					</Text>
				</View>

				<View className="gap-3">
					<Pressable
						onPress={() => {
							hapticPress();
							router.push("/levels");
						}}
						className="items-center justify-center rounded-full border-2 border-white bg-amber-300 py-4 shadow-md"
					>
						<Text className="font-heading text-xl text-amber-950">
							はじめる
						</Text>
					</Pressable>

					<SecondaryButton
						icon={
							<Ionicons
								name="settings-outline"
								size={18}
								color={theme.icon.onSecondaryButton}
							/>
						}
						label="設定"
						onPress={() => {
							hapticPress();
							setSettingsOpen(true);
						}}
					/>
				</View>
			</Animated.View>

			<SettingsSheet
				visible={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				onLab={() => {
					setSettingsOpen(false);
					router.push("/lab");
				}}
			/>
		</View>
	);
}

function SecondaryButton({
	icon,
	label,
	onPress,
}: {
	icon: ReactNode;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			className="min-h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-stone-200/80 bg-white/95 px-3 py-3 shadow-sm"
		>
			{icon}
			<Text className="font-heading text-sm text-stone-700">{label}</Text>
		</Pressable>
	);
}

function SettingsSheet({
	visible,
	onClose,
	onLab,
}: {
	visible: boolean;
	onClose: () => void;
	onLab: () => void;
}) {
	const insets = useSafeAreaInsets();
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 justify-end bg-black/35" onPress={onClose}>
				<Pressable
					onPress={(event) => event.stopPropagation()}
					className="rounded-t-3xl bg-amber-50 px-6 pt-5"
					style={{ paddingBottom: insets.bottom + 20 }}
				>
					<View className="mb-5 flex-row items-center justify-between">
						<Text className="font-heading text-xl text-amber-950">設定</Text>
						<Pressable
							accessibilityLabel="閉じる"
							hitSlop={10}
							onPress={onClose}
							className="h-10 w-10 items-center justify-center rounded-full bg-white"
						>
							<Ionicons name="close" size={22} color={theme.icon.onLight} />
						</Pressable>
					</View>

					<View className="mb-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
						<Text className="font-heading text-base text-stone-700">BGM</Text>
						<BgmToggle />
					</View>

					<Button
						label="生成テスト"
						variant="secondary"
						iconLeft="flask-outline"
						onPress={onLab}
					/>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

/** デザインイメージの三連ヘックス */
function HexCluster() {
	const s = 11;
	const h = s * Math.sqrt(3);
	const points = (cx: number, cy: number) => {
		const pts: string[] = [];
		for (let i = 0; i < 6; i++) {
			const a = ((60 * i - 30) * Math.PI) / 180;
			pts.push(`${cx + s * Math.cos(a)},${cy + s * Math.sin(a)}`);
		}
		return pts.join(" ");
	};
	return (
		<Svg width={40} height={36} viewBox="0 0 40 36">
			<Polygon
				points={points(13, 12)}
				fill={COLOR_HEX.green}
				stroke="#fff"
				strokeWidth={1.2}
			/>
			<Polygon
				points={points(27, 12)}
				fill="#86efac"
				stroke="#fff"
				strokeWidth={1.2}
			/>
			<Polygon
				points={points(20, 12 + h * 0.55)}
				fill={COLOR_HEX.yellow}
				stroke="#fff"
				strokeWidth={1.2}
			/>
		</Svg>
	);
}

function BeeMark() {
	return (
		<Svg width={28} height={24} viewBox="0 0 28 24">
			<Ellipse cx={10} cy={10} rx={5} ry={3.5} fill="#fde68a" opacity={0.9} />
			<Ellipse cx={18} cy={10} rx={5} ry={3.5} fill="#fde68a" opacity={0.9} />
			<Ellipse cx={14} cy={12} rx={6} ry={5} fill="#fbbf24" />
			<Path
				d="M10 10 Q14 8 18 10"
				stroke="#78350f"
				strokeWidth={1.4}
				fill="none"
			/>
			<Path
				d="M10 13 Q14 11 18 13"
				stroke="#78350f"
				strokeWidth={1.4}
				fill="none"
			/>
			<Ellipse cx={14} cy={7} rx={3.2} ry={2.6} fill="#44403c" />
			<Path d="M11 5 L9 2" stroke="#44403c" strokeWidth={1.2} />
			<Path d="M17 5 L19 2" stroke="#44403c" strokeWidth={1.2} />
		</Svg>
	);
}

const styles = StyleSheet.create({
	titleShadow: {
		textShadowColor: "rgba(255,255,255,0.55)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
});
