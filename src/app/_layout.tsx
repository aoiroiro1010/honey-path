import {
	useFonts,
	ZenMaruGothic_500Medium,
	ZenMaruGothic_700Bold,
} from "@expo-google-fonts/zen-maru-gothic";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useProgress } from "@/game/levels";
import { prepareAudio, startBgm } from "@/ui/audio";
import { useAudioPrefs } from "@/ui/audioPrefs";

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		ZenMaruGothic_500Medium,
		ZenMaruGothic_700Bold,
	});
	const [hydrated, setHydrated] = useState(useProgress.persist.hasHydrated());
	const [audioHydrated, setAudioHydrated] = useState(
		useAudioPrefs.persist.hasHydrated(),
	);
	const fontsReady = fontsLoaded || Boolean(fontError);
	const ready = fontsReady && hydrated && audioHydrated;

	useEffect(() => {
		void prepareAudio();
	}, []);

	useEffect(() => {
		const unsub = useProgress.persist.onFinishHydration(() => {
			setHydrated(true);
		});
		if (useProgress.persist.hasHydrated()) {
			setHydrated(true);
		}
		return unsub;
	}, []);

	useEffect(() => {
		const unsub = useAudioPrefs.persist.onFinishHydration(() => {
			setAudioHydrated(true);
		});
		if (useAudioPrefs.persist.hasHydrated()) {
			setAudioHydrated(true);
		}
		return unsub;
	}, []);

	useEffect(() => {
		if (!ready) {
			return;
		}
		void (async () => {
			await prepareAudio();
			startBgm();
			await SplashScreen.hideAsync();
		})();
	}, [ready]);

	if (!ready) {
		return null;
	}

	return (
		<>
			<StatusBar style="dark" />
			<Stack screenOptions={{ headerShown: false, animation: "fade" }} />
		</>
	);
}
