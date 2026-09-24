import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import { hapticPress, hapticReset } from "./haptics";
import { theme } from "./theme";

type IconName = keyof typeof Ionicons.glyphMap;
type Feedback = "press" | "reset";

function runFeedback(feedback: Feedback) {
	if (feedback === "reset") {
		hapticReset();
		return;
	}
	hapticPress();
}

type Props = {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary";
	iconLeft?: IconName;
	iconRight?: IconName;
	feedback?: Feedback;
};

export function Button({
	label,
	onPress,
	variant = "primary",
	iconLeft,
	iconRight,
	feedback = "press",
}: Props) {
	const primary = variant === "primary";
	const color = primary
		? theme.icon.onPrimaryButton
		: theme.icon.onSecondaryButton;
	return (
		<Pressable
			onPress={() => {
				runFeedback(feedback);
				onPress();
			}}
			className={`flex-row items-center justify-center gap-2 rounded-full px-8 py-4 ${
				primary ? "bg-amber-300" : "border border-stone-300 bg-white"
			}`}
		>
			{iconLeft ? <Ionicons name={iconLeft} size={20} color={color} /> : null}
			<Text
				className={`font-heading text-lg ${
					primary ? "text-amber-950" : "text-stone-700"
				}`}
			>
				{label}
			</Text>
			{iconRight ? <Ionicons name={iconRight} size={20} color={color} /> : null}
		</Pressable>
	);
}

type IconButtonProps = {
	name: IconName;
	onPress: () => void;
	disabled?: boolean;
	accessibilityLabel: string;
	feedback?: Feedback;
};

export function IconButton({
	name,
	onPress,
	disabled,
	accessibilityLabel,
	feedback = "press",
}: IconButtonProps) {
	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			disabled={disabled}
			hitSlop={10}
			onPress={() => {
				if (disabled) {
					return;
				}
				runFeedback(feedback);
				onPress();
			}}
			className="h-11 w-11 items-center justify-center rounded-full bg-white/80"
		>
			<Ionicons
				name={name}
				size={22}
				color={disabled ? theme.icon.onLightDisabled : theme.icon.onLight}
			/>
		</Pressable>
	);
}
