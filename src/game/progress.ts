import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ProgressState = {
	cleared: string[];
	markCleared: (id: string) => void;
	isCleared: (id: string) => boolean;
};

export const useProgress = create<ProgressState>()(
	persist(
		(set, get) => ({
			cleared: [],
			markCleared: (id) =>
				set((state) =>
					state.cleared.includes(id)
						? state
						: { cleared: [...state.cleared, id] },
				),
			isCleared: (id) => get().cleared.includes(id),
		}),
		{
			name: "honey-path-progress",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
