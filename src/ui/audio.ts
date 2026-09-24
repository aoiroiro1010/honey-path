import {
	type AudioPlayer,
	createAudioPlayer,
	preload,
	setAudioModeAsync,
} from "expo-audio";
import { useAudioPrefs } from "./audioPrefs";

const SFX = {
	cell: require("../../assets/audio/sfx/cell.wav"),
	erase: require("../../assets/audio/sfx/erase.wav"),
	clear: require("../../assets/audio/sfx/clear.wav"),
	tap: require("../../assets/audio/sfx/tap.wav"),
	reset: require("../../assets/audio/sfx/reset.wav"),
} as const;

const BGM = require("../../assets/audio/bgm/bgm.mp3");

export type SfxName = keyof typeof SFX;

/** 連打向けに複数プレイヤーを回す */
const POOL_SIZE: Record<SfxName, number> = {
	cell: 4,
	erase: 2,
	clear: 1,
	tap: 2,
	reset: 1,
};

let prepared: Promise<void> | null = null;
const pools = new Map<SfxName, AudioPlayer[]>();
const cursors = new Map<SfxName, number>();
let bgmPlayer: AudioPlayer | null = null;

function makeSfxPlayer(source: number): AudioPlayer {
	const player = createAudioPlayer(source, {
		keepAudioSessionActive: true,
		updateInterval: 1000,
	});
	player.volume = 1;
	return player;
}

/**
 * セッション設定・preload・プレイヤー生成を済ませる。
 * スプラッシュ中に呼ぶと初回 SE の遅延を減らせる。
 */
export function prepareAudio(): Promise<void> {
	if (!prepared) {
		prepared = (async () => {
			await setAudioModeAsync({
				playsInSilentMode: true,
				interruptionMode: "mixWithOthers",
			}).catch(() => {
				/* web / unsupported */
			});

			for (const name of Object.keys(SFX) as SfxName[]) {
				const source = SFX[name];
				const count = POOL_SIZE[name];
				const players: AudioPlayer[] = [];
				for (let i = 0; i < count; i++) {
					// iOS は create で preload キャッシュを消費するため、都度 preload
					await preload(source).catch(() => {
						/* ignore */
					});
					players.push(makeSfxPlayer(source));
				}
				pools.set(name, players);
				cursors.set(name, 0);
			}
		})();
	}
	return prepared;
}

/** 効果音（ホットパスでは await しない） */
export function playSfx(name: SfxName) {
	const players = pools.get(name);
	if (!players?.length) {
		void prepareAudio().then(() => playSfx(name));
		return;
	}

	const cursor = cursors.get(name) ?? 0;
	const player = players[cursor % players.length];
	if (!player) {
		return;
	}
	cursors.set(name, cursor + 1);

	// 先頭で止まっているなら seek せず即再生
	if (!player.playing && player.currentTime < 0.02) {
		player.play();
		return;
	}

	void player.seekTo(0, 0, 0).then(() => {
		player.play();
	});
}

/** アプリ全体の BGM（ループ）。設定オフなら開始しない */
export function startBgm() {
	void (async () => {
		try {
			await prepareAudio();
			if (!useAudioPrefs.getState().bgmEnabled) {
				return;
			}
			if (!bgmPlayer) {
				bgmPlayer = createAudioPlayer(BGM, {
					keepAudioSessionActive: true,
					updateInterval: 1000,
				});
				bgmPlayer.loop = true;
				bgmPlayer.volume = 0.35;
			}
			if (!bgmPlayer.playing) {
				bgmPlayer.play();
			}
		} catch {
			/* ignore */
		}
	})();
}

export function stopBgm() {
	try {
		bgmPlayer?.pause();
	} catch {
		/* ignore */
	}
}
