import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { hapticPress } from "./haptics";
import { theme } from "./theme";

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
	const fill = done
		? theme.hexTile.doneFill
		: unlocked
			? theme.hexTile.openFill
			: theme.hexTile.lockedFill;
	const stroke = done
		? theme.hexTile.doneStroke
		: unlocked
			? theme.hexTile.openStroke
			: theme.hexTile.lockedStroke;
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
			className="w-20 items-center"
		>
			<View className="relative h-[72px] w-[72px]">
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
						<Ionicons
							name="lock-closed"
							size={22}
							color={theme.icon.onLightMuted}
						/>
					)}
				</View>
			</View>
			{done ? (
				<View className="mt-0.5">
					<Ionicons name="star" size={14} color={theme.icon.starAmber} />
				</View>
			) : (
				<View className="h-4" />
			)}
		</Pressable>
	);
}
