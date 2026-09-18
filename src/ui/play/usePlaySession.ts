import { useCallback } from "react";
import { type Level, useProgress } from "@/game/levels";
import { useBoardSession } from "./useBoardSession";

export function usePlaySession(level: Level | undefined) {
	const markCleared = useProgress((state) => state.markCleared);
	const onClear = useCallback(() => {
		if (level) {
			markCleared(level.id);
		}
	}, [level, markCleared]);

	return useBoardSession(level?.board, {
		onClear,
		animateClear: true,
	});
}
