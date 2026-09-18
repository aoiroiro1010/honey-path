import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { IconButton } from "./Button";

type Props = {
	title: string;
	onBack: () => void;
	onReset?: () => void;
	trailing?: ReactNode;
};

export function ScreenHeader({ title, onBack, onReset, trailing }: Props) {
	return (
		<View className="mb-2 flex-row items-center justify-between px-4">
			<IconButton
				name="arrow-back"
				accessibilityLabel="戻る"
				onPress={onBack}
			/>
			<Text className="font-heading text-xl text-amber-950">{title}</Text>
			{trailing ? (
				trailing
			) : onReset ? (
				<IconButton
					name="refresh"
					accessibilityLabel="リセット"
					onPress={onReset}
				/>
			) : (
				<View className="h-11 w-11" />
			)}
		</View>
	);
}
