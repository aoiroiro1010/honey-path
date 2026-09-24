import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { generateBoard, parseDifficulty, parseIntField } from "@/game/generate";
import type { Difficulty } from "@/game/generate/difficulty";
import type { Board } from "@/game/model/board";
import {
	Button,
	IconButton,
	PlayingView,
	Screen,
	ScreenHeader,
	useBoardSession,
} from "@/ui";
import { theme } from "@/ui/theme";

type FieldKey = keyof Difficulty | "seed";

type FieldDraft = {
	seed: string;
	radius: string;
	colorCount: string;
	holeCount: string;
	numbersPerColor: string;
};

const DEFAULT_DRAFT: FieldDraft = {
	seed: "13",
	radius: "5",
	colorCount: "1",
	holeCount: "5",
	numbersPerColor: "0",
};

const FIELD_META: {
	key: FieldKey;
	label: string;
	hint: string;
}[] = [
	{
		key: "seed",
		label: "問題番号",
		hint: "同じ数字だと同じ盤面になります",
	},
	{
		key: "radius",
		label: "盤の大きさ",
		hint: "大きいほどマスが増えます",
	},
	{
		key: "colorCount",
		label: "色の数",
		hint: "引く線の色の種類",
	},
	{
		key: "holeCount",
		label: "穴の数",
		hint: "通れないマスの数",
	},
	{
		key: "numbersPerColor",
		label: "数字マス",
		hint: "色ごとに置く数字の個数",
	},
];

export default function LabScreen() {
	const router = useRouter();
	const [draft, setDraft] = useState<FieldDraft>(DEFAULT_DRAFT);
	const [settingsOpen, setSettingsOpen] = useState(true);
	const [board, setBoard] = useState<Board | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { lines, setLines, cleared, reset } = useBoardSession(board);

	const generate = useCallback((values: FieldDraft) => {
		const seed = parseIntField(values.seed, 1);
		const difficulty = parseDifficulty({
			radius: values.radius,
			colorCount: values.colorCount,
			holeCount: values.holeCount,
			numbersPerColor: values.numbersPerColor,
		});

		setBusy(true);
		setError(null);

		requestAnimationFrame(() => {
			try {
				const next = generateBoard(seed, difficulty);
				setBoard(next);
				setSettingsOpen(false);
			} catch (e) {
				setError(
					e instanceof Error
						? e.message
						: "問題を作れませんでした。数値を変えてやり直してください",
				);
			} finally {
				setBusy(false);
			}
		});
	}, []);

	const settingsButton = (
		<IconButton
			name="options-outline"
			accessibilityLabel="問題の設定"
			onPress={() => {
				setError(null);
				setSettingsOpen(true);
			}}
		/>
	);

	return (
		<>
			{/* 盤面ドラッグと iOS の戻るスワイプが競合するので無効化 */}
			<Stack.Screen options={{ gestureEnabled: false }} />
			<Screen>
				{board ? (
					<>
						{cleared ? (
							<Text className="px-4 pb-1 text-center font-heading text-base text-amber-800">
								クリア！
							</Text>
						) : null}
						<PlayingView
							board={board}
							lines={lines}
							title="カスタム問題"
							onChangeLines={cleared ? undefined : setLines}
							onBack={() => router.dismissTo("/")}
							onReset={reset}
							trailing={settingsButton}
						/>
					</>
				) : (
					<View className="flex-1">
						<ScreenHeader
							title="カスタム問題"
							onBack={() => router.dismissTo("/")}
							trailing={settingsButton}
						/>
						<View className="flex-1 items-center justify-center gap-4 px-8">
							<Text className="text-center text-base leading-6 text-stone-600">
								条件を決めて問題をつくり、{"\n"}その場で遊べます。
							</Text>
							<Button
								label="問題の設定"
								iconLeft="options-outline"
								onPress={() => {
									setError(null);
									setSettingsOpen(true);
								}}
							/>
						</View>
					</View>
				)}
			</Screen>

			<GenerateSettingsDialog
				visible={settingsOpen}
				draft={draft}
				busy={busy}
				error={error}
				onChangeDraft={setDraft}
				onClose={() => {
					if (!busy) {
						setSettingsOpen(false);
					}
				}}
				onGenerate={() => {
					if (!busy) {
						generate(draft);
					}
				}}
			/>
		</>
	);
}

function GenerateSettingsDialog({
	visible,
	draft,
	busy,
	error,
	onChangeDraft,
	onClose,
	onGenerate,
}: {
	visible: boolean;
	draft: FieldDraft;
	busy: boolean;
	error: string | null;
	onChangeDraft: (next: FieldDraft) => void;
	onClose: () => void;
	onGenerate: () => void;
}) {
	const insets = useSafeAreaInsets();
	const preview = useMemo(
		() =>
			parseDifficulty({
				radius: draft.radius,
				colorCount: draft.colorCount,
				holeCount: draft.holeCount,
				numbersPerColor: draft.numbersPerColor,
			}),
		[draft],
	);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<Pressable className="flex-1 justify-end bg-black/35" onPress={onClose}>
					<Pressable
						onPress={(event) => event.stopPropagation()}
						className="max-h-[90%] rounded-t-3xl bg-amber-50 px-5 pt-5"
						style={{ paddingBottom: insets.bottom + 16 }}
					>
						<View className="mb-4 flex-row items-center justify-between">
							<Text className="font-heading text-xl text-amber-950">
								問題の設定
							</Text>
							<IconButton
								name="close"
								accessibilityLabel="閉じる"
								onPress={onClose}
								disabled={busy}
							/>
						</View>

						<View className="mb-3 flex-row flex-wrap gap-3">
							{FIELD_META.map((field) => (
								<View key={field.key} className="min-w-[46%] flex-1 gap-1">
									<Text className="font-heading text-sm text-stone-700">
										{field.label}
									</Text>
									<Text className="text-xs text-stone-400">{field.hint}</Text>
									<TextInput
										value={draft[field.key]}
										onChangeText={(next) =>
											onChangeDraft({ ...draft, [field.key]: next })
										}
										editable={!busy}
										keyboardType="number-pad"
										className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900"
									/>
								</View>
							))}
						</View>

						<Text className="mb-3 text-xs text-stone-500">
							いまの設定: 大きさ {preview.radius} / {preview.colorCount}色 / 穴{" "}
							{preview.holeCount} / 数字 {preview.numbersPerColor}
						</Text>

						{error ? (
							<Text className="mb-3 text-sm text-red-700">{error}</Text>
						) : null}

						{busy ? (
							<View className="mb-3 items-center py-1">
								<ActivityIndicator color={theme.spinner} />
							</View>
						) : null}

						<Button
							label={busy ? "作成中…" : "問題をつくる"}
							onPress={onGenerate}
						/>
					</Pressable>
				</Pressable>
			</KeyboardAvoidingView>
		</Modal>
	);
}
