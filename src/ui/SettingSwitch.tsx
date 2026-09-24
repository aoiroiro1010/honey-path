import { Switch, Text, View } from "react-native";
import { theme } from "./theme";

type Props = {
	label: string;
	value: boolean;
	onValueChange: (next: boolean) => void;
};

export function SettingSwitch({ label, value, onValueChange }: Props) {
	return (
		<View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
			<Text className="font-heading text-base text-stone-700">{label}</Text>
			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ false: "#d6d3d1", true: "#fcd34d" }}
				thumbColor={value ? theme.icon.accent : "#f5f5f4"}
				ios_backgroundColor="#d6d3d1"
			/>
		</View>
	);
}
