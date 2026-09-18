import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tone = "cream" | "clear";

type Props = {
	children: ReactNode;
	tone?: Tone;
	/** 上下の余白を少し広め（タイトルなど） */
	spacious?: boolean;
	className?: string;
};

const toneClass: Record<Tone, string> = {
	cream: "bg-amber-50",
	clear: "bg-clear",
};

export function Screen({
	children,
	tone = "cream",
	spacious = false,
	className = "",
}: Props) {
	const insets = useSafeAreaInsets();
	const top = insets.top + (spacious ? 48 : 8);
	const bottom = insets.bottom + (spacious ? 32 : 12);

	return (
		<View
			className={`flex-1 ${toneClass[tone]} ${className}`.trim()}
			style={{ paddingTop: top, paddingBottom: bottom }}
		>
			{children}
		</View>
	);
}
