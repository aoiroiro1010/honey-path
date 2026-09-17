import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { CellView } from "./CellView";

const meta = {
	title: "Cell",
	component: CellView,
	decorators: [
		(Story) => (
			<View className="flex-1 items-center justify-center bg-neutral-100">
				<Story />
			</View>
		),
	],
} satisfies Meta<typeof CellView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		cell: { x: 0, y: 0 },
	},
};

export const Start: Story = {
	args: {
		cell: { x: 0, y: 0, start: { color: "red" } },
	},
};

export const Goal: Story = {
	args: {
		cell: { x: 0, y: 0, goal: { color: "blue" } },
	},
};

export const NumberMark: Story = {
	args: {
		cell: { x: 0, y: 0, number: { color: "green", value: 1 } },
	},
};

export const Dirs: Story = {
	args: {
		cell: { x: 0, y: 0, dirs: { a: "R", b: "L" } },
	},
};
