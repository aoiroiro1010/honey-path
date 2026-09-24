import * as Haptics from "expo-haptics";
import { playSfx } from "./audio";
import { useAudioPrefs } from "./audioPrefs";

function runHaptic(task: () => Promise<void>) {
	if (!useAudioPrefs.getState().hapticsEnabled) {
		return;
	}
	void task().catch(() => {
		/* web / unsupported device */
	});
}

/** マスに線が進んだとき */
export function hapticCell() {
	playSfx("cell");
	runHaptic(() => Haptics.selectionAsync());
}

/** 線を消した・戻したとき */
export function hapticClear() {
	playSfx("erase");
	runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** レベルクリア */
export function hapticSuccess() {
	playSfx("clear");
	runHaptic(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	);
}

/** ボタン押下 */
export function hapticPress() {
	playSfx("tap");
	runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** リセット */
export function hapticReset() {
	playSfx("reset");
	runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** 伸ばせないとき（誤操作でも頻発するため SE は鳴らさない） */
export function hapticBlocked() {
	runHaptic(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
	);
}
