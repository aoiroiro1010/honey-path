import { Pressable, Text } from "react-native";

type Props = {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary";
};

export function Button({ label, onPress, variant = "primary" }: Props) {
	const primary = variant === "primary";
	return (
		<Pressable
			onPress={onPress}
			className={`items-center rounded-full px-8 py-4 ${
				primary ? "bg-amber-300" : "border border-stone-300 bg-white"
			}`}
		>
			<Text
				className={`font-heading text-lg ${
					primary ? "text-amber-950" : "text-stone-700"
				}`}
			>
				{label}
			</Text>
		</Pressable>
	);
}
