import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isBoardCleared, linesFromBoard } from "@/game/draw";
import { generateBoard } from "@/game/generate";
import type { Difficulty } from "@/game/generate/difficulty";
import type { Board } from "@/game/model/board";
import type { Line } from "@/game/model/line";
import { Button } from "@/ui/Button";
import { BoardView } from "@/ui/board";
import { hapticSuccess } from "@/ui/haptics";

type FieldKey = keyof Difficulty | "seed";

function parseIntField(value: string, fallback: number): number {
	const n = Number(value);
	return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function ParamField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (next: string) => void;
}) {
	return (
		<View className="min-w-[46%] flex-1 gap-1">
			<Text className="text-xs text-stone-500">{label}</Text>
			<TextInput
				value={value}
				onChangeText={onChange}
				keyboardType="number-pad"
				className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900"
			/>
		</View>
	);
}

export default function LabScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [seedText, setSeedText] = useState("13");
	const [radiusText, setRadiusText] = useState("5");
	const [colorCountText, setColorCountText] = useState("1");
	const [holeCountText, setHoleCountText] = useState("5");
	const [numbersText, setNumbersText] = useState("0");

	const [board, setBoard] = useState<Board | null>(null);
	const [lines, setLines] = useState<Line[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [meta, setMeta] = useState<string | null>(null);
	const [cleared, setCleared] = useState(false);

	const fields: {
		key: FieldKey;
		label: string;
		value: string;
		set: (v: string) => void;
	}[] = [
		{
			key: "seed",
			label: "seed（レベル key）",
			value: seedText,
			set: setSeedText,
		},
		{ key: "radius", label: "radius", value: radiusText, set: setRadiusText },
		{
			key: "colorCount",
			label: "colorCount",
			value: colorCountText,
			set: setColorCountText,
		},
		{
			key: "holeCount",
			label: "holeCount",
			value: holeCountText,
			set: setHoleCountText,
		},
		{
			key: "numbersPerColor",
			label: "numbersPerColor",
			value: numbersText,
			set: setNumbersText,
		},
	];

	const difficultyPreview = useMemo((): Difficulty => {
		return {
			radius: Math.max(1, parseIntField(radiusText, 5)),
			colorCount: Math.max(1, Math.min(6, parseIntField(colorCountText, 1))),
			holeCount: Math.max(0, parseIntField(holeCountText, 0)),
			numbersPerColor: Math.max(0, parseIntField(numbersText, 0)),
		};
	}, [radiusText, colorCountText, holeCountText, numbersText]);

	const generate = useCallback(() => {
		const seed = parseIntField(seedText, 1);
		const difficulty: Difficulty = {
			radius: Math.max(1, parseIntField(radiusText, 5)),
			colorCount: Math.max(1, Math.min(6, parseIntField(colorCountText, 1))),
			holeCount: Math.max(0, parseIntField(holeCountText, 0)),
			numbersPerColor: Math.max(0, parseIntField(numbersText, 0)),
		};

		setBusy(true);
		setError(null);
		setCleared(false);
		setMeta(null);

		// 生成が重いので1フレーム空けて UI を更新してから走る
		requestAnimationFrame(() => {
			try {
				const t0 = Date.now();
				const next = generateBoard(seed, difficulty);
				const ms = Date.now() - t0;
				const cells = next.cells.length;
				const dirs = next.cells.filter((c) => c.dirs).length;
				const colors = next.cells.filter((c) => c.start).length;
				const nums = next.cells.filter((c) => c.number).length;
				setBoard(next);
				setLines(linesFromBoard(next));
				setMeta(
					`${ms}ms · ${cells}マス · ${colors}色 · 向き${dirs} · 番号${nums}`,
				);
			} catch (e) {
				setBoard(null);
				setLines([]);
				setError(e instanceof Error ? e.message : "生成に失敗しました");
			} finally {
				setBusy(false);
			}
		});
	}, [seedText, radiusText, colorCountText, holeCountText, numbersText]);

	const onChangeLines = useCallback(
		(next: Line[]) => {
			setLines(next);
			if (!board || cleared) {
				return;
			}
			if (isBoardCleared(board, next)) {
				setCleared(true);
				hapticSuccess();
			}
		},
		[board, cleared],
	);

	return (
		<View
			className="flex-1 bg-amber-50"
			style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
		>
			<View className="mb-3 flex-row items-center justify-between px-6">
				<Pressable onPress={() => router.back()} hitSlop={12}>
					<Text className="text-base text-stone-600">戻る</Text>
				</Pressable>
				<Text className="font-heading text-xl text-amber-950">生成テスト</Text>
				<View className="w-10" />
			</View>

			<ScrollView
				className="flex-1"
				contentContainerClassName="gap-4 px-6 pb-6"
				keyboardShouldPersistTaps="handled"
			>
				<View className="flex-row flex-wrap gap-3">
					{fields.map((field) => (
						<ParamField
							key={field.key}
							label={field.label}
							value={field.value}
							onChange={field.set}
						/>
					))}
				</View>

				<Text className="text-xs text-stone-500">
					適用予定: r{difficultyPreview.radius} / {difficultyPreview.colorCount}
					色 / 穴{difficultyPreview.holeCount} / 番号
					{difficultyPreview.numbersPerColor}
				</Text>

				<Button
					label={busy ? "生成中…" : "問題を生成"}
					onPress={() => {
						if (!busy) {
							generate();
						}
					}}
				/>

				{busy ? (
					<View className="items-center py-2">
						<ActivityIndicator color="#78350f" />
					</View>
				) : null}

				{error ? <Text className="text-sm text-red-700">{error}</Text> : null}
				{meta ? <Text className="text-sm text-stone-600">{meta}</Text> : null}
				{cleared ? (
					<Text className="font-heading text-base text-amber-800">
						クリア！
					</Text>
				) : null}

				{board ? (
					<>
						<View
							className="items-center justify-center py-2"
							style={{ userSelect: "none" }}
						>
							<BoardView
								board={board}
								lines={lines}
								onChangeLines={onChangeLines}
							/>
						</View>
						<Button
							label="リセット"
							variant="secondary"
							onPress={() => {
								setCleared(false);
								setLines(linesFromBoard(board));
							}}
						/>
					</>
				) : (
					<Text className="text-center text-sm text-stone-500">
						パラメータを入れて「問題を生成」を押すと、ここでプレイできます
					</Text>
				)}
			</ScrollView>
		</View>
	);
}
