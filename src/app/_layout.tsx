import {
	useFonts,
	ZenMaruGothic_500Medium,
	ZenMaruGothic_700Bold,
} from "@expo-google-fonts/zen-maru-gothic";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		ZenMaruGothic_500Medium,
		ZenMaruGothic_700Bold,
	});
	const ready = fontsLoaded || Boolean(fontError);

	useEffect(() => {
		if (ready) {
			void SplashScreen.hideAsync();
		}
	}, [ready]);

	if (!ready) {
		return null;
	}

	return (
		<>
			<StatusBar style="auto" />
			<Stack screenOptions={{ headerShown: false }} />
		</>
	);
}
