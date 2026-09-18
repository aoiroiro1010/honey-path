import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { hapticPress } from "./haptics";

const SIZE = 72;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 2;

function hexPoints(cx: number, cy: number, r: number): string {
	const pts: string[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = ((60 * i - 30) * Math.PI) / 180;
		pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
	}
	return pts.join(" ");
}

type Props = {
	id: string;
	done: boolean;
	unlocked: boolean;
	onPress: () => void;
};

export function HexLevelTile({ id, done, unlocked, onPress }: Props) {
	const fill = done ? "#fcd34d" : unlocked ? "#ffffff" : "#e7e5e4";
	const stroke = done ? "#f59e0b" : unlocked ? "#d6d3d1" : "#d6d3d1";
	const textColor = done
		? "text-amber-950"
		: unlocked
			? "text-stone-700"
			: "text-stone-400";

	return (
		<Pressable
			disabled={!unlocked}
			onPress={() => {
				hapticPress();
				onPress();
			}}
			className="items-center"
			style={{ width: SIZE + 8 }}
		>
			<View style={{ width: SIZE, height: SIZE }}>
				<Svg width={SIZE} height={SIZE}>
					<Polygon
						points={hexPoints(CX, CY, R)}
						fill={fill}
						stroke={stroke}
						strokeWidth={2}
					/>
				</Svg>
				<View
					pointerEvents="none"
					className="absolute inset-0 items-center justify-center"
				>
					{unlocked ? (
						<Text className={`font-heading text-2xl ${textColor}`}>{id}</Text>
					) : (
						<Ionicons name="lock-closed" size={22} color="#a8a29e" />
					)}
				</View>
			</View>
			{done ? (
				<Ionicons
					name="star"
					size={14}
					color="#f59e0b"
					style={{ marginTop: 2 }}
				/>
			) : (
				<View style={{ height: 16 }} />
			)}
		</Pressable>
	);
}
