import * as Haptics from "expo-haptics";

function run(task: () => Promise<void>) {
	void task().catch(() => {
		/* web / unsupported device */
	});
}

/** マスに線が進んだ・戻ったとき */
export function hapticCell() {
	run(() => Haptics.selectionAsync());
}

/** 線を消した・リセットしたとき */
export function hapticClear() {
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** レベルクリア */
export function hapticSuccess() {
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	);
}

/** ボタン押下 */
export function hapticPress() {
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}
