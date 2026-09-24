import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import type { Board } from "@/game/model/board";
import type { Line } from "@/game/model/line";
import { isBoardCleared, linesFromBoard } from "@/game/play";
import { hapticSuccess } from "../haptics";

type Options = {
	/** クリア時に進捗保存など */
	onClear?: () => void;
	/** true のときクリア演出用の opacity アニメを回す */
	animateClear?: boolean;
};

export function useBoardSession(
	board: Board | null | undefined,
	options: Options = {},
) {
	const { onClear, animateClear = false } = options;
	const onClearRef = useRef(onClear);
	onClearRef.current = onClear;

	const [lines, setLines] = useState<Line[]>(() =>
		board ? linesFromBoard(board) : [],
	);
	const [cleared, setCleared] = useState(false);
	const clearedOnce = useRef(false);
	const clearOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		clearedOnce.current = false;
		setCleared(false);
		clearOpacity.setValue(0);
		setLines(board ? linesFromBoard(board) : []);
	}, [board, clearOpacity]);

	useEffect(() => {
		if (!board || clearedOnce.current) {
			return;
		}
		if (!isBoardCleared(board, lines)) {
			return;
		}
		clearedOnce.current = true;
		hapticSuccess();
		onClearRef.current?.();
		setCleared(true);
		if (animateClear) {
			Animated.timing(clearOpacity, {
				toValue: 1,
				duration: 180,
				useNativeDriver: true,
			}).start();
		} else {
			clearOpacity.setValue(1);
		}
	}, [board, lines, animateClear, clearOpacity]);

	const reset = useCallback(() => {
		if (!board) {
			return;
		}
		clearedOnce.current = false;
		setCleared(false);
		clearOpacity.setValue(0);
		setLines(linesFromBoard(board));
	}, [board, clearOpacity]);

	return { lines, setLines, cleared, clearOpacity, reset };
}
