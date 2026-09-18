import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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

	if (cleared) {
		return (
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
		);
	}

	return (
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
	);
}
