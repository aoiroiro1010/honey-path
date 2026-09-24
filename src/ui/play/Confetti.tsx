import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { COLOR_HEX } from "../board/palette";

const PIECE_COLORS = [
	COLOR_HEX.green,
	COLOR_HEX.blue,
	COLOR_HEX.orange,
	COLOR_HEX.purple,
	COLOR_HEX.yellow,
	"#fbbf24",
	"#fde68a",
	"#ffffff",
] as const;

type Piece = {
	id: number;
	left: number;
	delay: number;
	duration: number;
	color: string;
	width: number;
	height: number;
	drift: number;
	spin: number;
};

function makePieces(count: number): Piece[] {
	return Array.from({ length: count }, (_, id) => {
		const tall = id % 3 !== 0;
		return {
			id,
			left: (id * 37 + 11) % 100,
			delay: (id * 70) % 900,
			duration: 2200 + (id % 7) * 280,
			color: PIECE_COLORS[id % PIECE_COLORS.length] ?? "#fbbf24",
			width: tall ? 5 + (id % 4) : 8 + (id % 5),
			height: tall ? 10 + (id % 6) : 5 + (id % 3),
			drift: -50 + ((id * 17) % 100),
			spin: 180 + ((id * 45) % 540),
		};
	});
}

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(piece.delay),
				Animated.timing(progress, {
					toValue: 1,
					duration: piece.duration,
					useNativeDriver: true,
				}),
				Animated.timing(progress, {
					toValue: 0,
					duration: 0,
					useNativeDriver: true,
				}),
			]),
		);
		anim.start();
		return () => anim.stop();
	}, [piece.delay, piece.duration, progress]);

	const translateY = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [-40, fall],
	});
	const translateX = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, piece.drift],
	});
	const rotate = progress.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", `${piece.spin}deg`],
	});
	const opacity = progress.interpolate({
		inputRange: [0, 0.08, 0.85, 1],
		outputRange: [0, 1, 1, 0],
	});

	return (
		<Animated.View
			pointerEvents="none"
			style={{
				position: "absolute",
				top: 0,
				left: `${piece.left}%`,
				width: piece.width,
				height: piece.height,
				borderRadius: 2,
				backgroundColor: piece.color,
				opacity,
				transform: [{ translateY }, { translateX }, { rotate }],
			}}
		/>
	);
}

/** クリア画面の紙吹雪（ループ） */
export function Confetti({ count = 40 }: { count?: number }) {
	const fall = Dimensions.get("window").height + 60;
	const pieces = useMemo(() => makePieces(count), [count]);

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFill}>
			{pieces.map((piece) => (
				<ConfettiPiece key={piece.id} piece={piece} fall={fall} />
			))}
		</View>
	);
}
