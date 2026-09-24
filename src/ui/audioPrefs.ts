import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AudioPrefsState = {
	bgmEnabled: boolean;
	setBgmEnabled: (enabled: boolean) => void;
	toggleBgm: () => void;
};

export const useAudioPrefs = create<AudioPrefsState>()(
	persist(
		(set, get) => ({
			bgmEnabled: true,
			setBgmEnabled: (bgmEnabled) => set({ bgmEnabled }),
			toggleBgm: () => set({ bgmEnabled: !get().bgmEnabled }),
		}),
		{
			name: "honey-path-audio",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
