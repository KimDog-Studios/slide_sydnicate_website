// Simple in-memory store for used gift token ids (tid). Persists per instance.
const g = globalThis as any;
if (!g.__SS_GIFT_USED__) {
	g.__SS_GIFT_USED__ = new Set<string>();
}
export const giftUsedStore = g.__SS_GIFT_USED__ as Set<string>;
