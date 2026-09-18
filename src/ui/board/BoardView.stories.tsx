import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { View } from "react-native";
import { sampleBoard } from "@/game/levels/samples";
import { linesFromBoard } from "@/game/play";

import { BoardView } from "./BoardView";

const meta = {
	title: "Board",
	component: BoardView,
	decorators: [
		(Story) => (
			<View className="flex-1 items-center justify-center bg-neutral-100">
				<Story />
			</View>
		),
	],
} satisfies Meta<typeof BoardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sample: Story = {
	args: {
		board: sampleBoard,
		lines: linesFromBoard(sampleBoard),
	},
};

export const Playable: Story = {
	args: {
		board: sampleBoard,
		lines: linesFromBoard(sampleBoard),
	},
	render: (args) => {
		const [lines, setLines] = useState(() => linesFromBoard(args.board));
		return (
			<BoardView board={args.board} lines={lines} onChangeLines={setLines} />
		);
	},
};
