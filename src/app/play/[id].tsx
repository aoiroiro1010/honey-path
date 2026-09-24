import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getLevel, nextLevelId } from "@/game/levels";
import { ClearedView, PlayingView, Screen, usePlaySession } from "@/ui";

export default function PlayScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const level = id ? getLevel(id) : undefined;
	const { lines, setLines, cleared, clearOpacity, reset } =
		usePlaySession(level);

	if (!level) {
		return <Redirect href="/levels" />;
	}

	const goLevels = () => router.replace("/levels");
	const goNext = () =>
		router.replace({
			pathname: "/play/[id]",
			params: { id: nextLevelId(level.id) },
		});

	return (
		<>
			{/* 盤面ドラッグと iOS の戻るスワイプが競合するので無効化 */}
			<Stack.Screen options={{ gestureEnabled: false }} />
			{cleared ? (
				<Screen tone="clear">
					<ClearedView
						board={level.board}
						lines={lines}
						levelName={level.name}
						opacity={clearOpacity}
						onNext={goNext}
						onLevels={goLevels}
					/>
				</Screen>
			) : (
				<Screen>
					<PlayingView
						board={level.board}
						lines={lines}
						title={level.name}
						onChangeLines={setLines}
						onBack={goLevels}
						onReset={reset}
					/>
				</Screen>
			)}
		</>
	);
}
