import { startBgm, stopBgm } from "./audio";
import { useAudioPrefs } from "./audioPrefs";
import { IconButton } from "./Button";

export function BgmToggle() {
	const enabled = useAudioPrefs((state) => state.bgmEnabled);
	const setBgmEnabled = useAudioPrefs((state) => state.setBgmEnabled);

	return (
		<IconButton
			name={enabled ? "volume-high" : "volume-mute"}
			accessibilityLabel={enabled ? "BGMをオフ" : "BGMをオン"}
			onPress={() => {
				const next = !enabled;
				setBgmEnabled(next);
				if (next) {
					startBgm();
				} else {
					stopBgm();
				}
			}}
		/>
	);
}
