import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerRootComponent } from "expo";
import { createElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { view } from "./storybook.requires";

const StorybookUIRoot = view.getStorybookUI({
	shouldPersistSelection: true,
	storage: {
		getItem: AsyncStorage.getItem,
		setItem: AsyncStorage.setItem,
	},
});

function Root() {
	return createElement(
		GestureHandlerRootView,
		{ style: { flex: 1 } },
		createElement(SafeAreaProvider, null, createElement(StorybookUIRoot)),
	);
}

registerRootComponent(Root);
