import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AudioPrefsState = {
	bgmEnabled: boolean;
	sfxEnabled: boolean;
	hapticsEnabled: boolean;
	setBgmEnabled: (enabled: boolean) => void;
	setSfxEnabled: (enabled: boolean) => void;
	setHapticsEnabled: (enabled: boolean) => void;
	toggleBgm: () => void;
};

export const useAudioPrefs = create<AudioPrefsState>()(
	persist(
		(set, get) => ({
			bgmEnabled: true,
			sfxEnabled: true,
			hapticsEnabled: true,
			setBgmEnabled: (bgmEnabled) => set({ bgmEnabled }),
			setSfxEnabled: (sfxEnabled) => set({ sfxEnabled }),
			setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
			toggleBgm: () => set({ bgmEnabled: !get().bgmEnabled }),
		}),
		{
			name: "honey-path-audio",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
