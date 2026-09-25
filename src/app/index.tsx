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
import { startBgm, stopBgm } from "@/ui/audio";
import { useAudioPrefs } from "@/ui/audioPrefs";
import { Button } from "@/ui/Button";
import { hapticPress } from "@/ui/haptics";
import { SettingSwitch } from "@/ui/SettingSwitch";
import { theme } from "@/ui/theme";

const BG = require("../../assets/images/background.png");
const LOGO = require("../../assets/images/title-logo.png");

export default function TitleScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const fade = useState(() => new Animated.Value(0))[0];
	const logoY = useState(() => new Animated.Value(0))[0];

	useEffect(() => {
		Animated.timing(fade, {
			toValue: 1,
			duration: 700,
			useNativeDriver: true,
		}).start();
		const bob = Animated.loop(
			Animated.sequence([
				Animated.timing(logoY, {
					toValue: -6,
					duration: 1200,
					useNativeDriver: true,
				}),
				Animated.timing(logoY, {
					toValue: 0,
					duration: 1200,
					useNativeDriver: true,
				}),
			]),
		);
		bob.start();
		return () => bob.stop();
	}, [fade, logoY]);

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
					<Animated.View style={{ transform: [{ translateY: logoY }] }}>
						<Image
							source={LOGO}
							style={styles.logo}
							contentFit="contain"
							accessibilityLabel="Honey Path"
							priority="high"
						/>
					</Animated.View>

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
	const bgmEnabled = useAudioPrefs((state) => state.bgmEnabled);
	const sfxEnabled = useAudioPrefs((state) => state.sfxEnabled);
	const hapticsEnabled = useAudioPrefs((state) => state.hapticsEnabled);
	const setBgmEnabled = useAudioPrefs((state) => state.setBgmEnabled);
	const setSfxEnabled = useAudioPrefs((state) => state.setSfxEnabled);
	const setHapticsEnabled = useAudioPrefs((state) => state.setHapticsEnabled);

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

					<SettingSwitch
						label="BGM"
						value={bgmEnabled}
						onValueChange={(next) => {
							setBgmEnabled(next);
							if (next) {
								startBgm();
							} else {
								stopBgm();
							}
						}}
					/>
					<SettingSwitch
						label="効果音"
						value={sfxEnabled}
						onValueChange={setSfxEnabled}
					/>
					<SettingSwitch
						label="振動"
						value={hapticsEnabled}
						onValueChange={setHapticsEnabled}
					/>

					<Button
						label="カスタム問題"
						variant="secondary"
						iconLeft="grid-outline"
						onPress={onLab}
					/>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	logo: {
		width: 280,
		height: 280,
	},
	titleShadow: {
		textShadowColor: "rgba(255,255,255,0.55)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
});
