import * as Haptics from "expo-haptics";
import { playSfx } from "./audio";

function run(task: () => Promise<void>) {
	void task().catch(() => {
		/* web / unsupported device */
	});
}

/** マスに線が進んだとき */
export function hapticCell() {
	playSfx("cell");
	run(() => Haptics.selectionAsync());
}

/** 線を消した・戻したとき */
export function hapticClear() {
	playSfx("erase");
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** レベルクリア */
export function hapticSuccess() {
	playSfx("clear");
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	);
}

/** ボタン押下 */
export function hapticPress() {
	playSfx("tap");
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** リセット */
export function hapticReset() {
	playSfx("reset");
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** 伸ばせないとき */
export function hapticBlocked() {
	playSfx("blocked");
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
	);
}
