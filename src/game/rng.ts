/** Mulberry32 — 同じシードなら同じ乱数列 */
export function createRng(seed: number): () => number {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export function rngInt(rng: () => number, maxExclusive: number): number {
	return Math.floor(rng() * maxExclusive);
}

export function rngPick<T>(rng: () => number, items: T[]): T {
	return items[rngInt(rng, items.length)];
}

export function rngShuffle<T>(rng: () => number, items: T[]): T[] {
	const next = [...items];
	for (let i = next.length - 1; i > 0; i--) {
		const j = rngInt(rng, i + 1);
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}
