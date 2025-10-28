import { NextResponse } from "next/server";

// Global in-memory store (ephemeral). Maps code -> { t: targetUserId, l: level, e: expiresAtMs }
declare global {
	// eslint-disable-next-line no-var
	var __giftStore: Map<string, { t: string; l: number; e: number }> | undefined;
}
const store = globalThis.__giftStore ?? (globalThis.__giftStore = new Map());

// Alphabet for codes (letters only). You can remove ambiguous letters if desired.
const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function randomLetters(n: number) {
	let s = "";
	const arr = new Uint32Array(n);
	crypto.getRandomValues(arr);
	for (let i = 0; i < n; i++) s += ALPH[arr[i] % ALPH.length];
	return s;
}
function genCode(): string {
	// 5 groups of 4 letters => 4 dashes total
	const parts = Array.from({ length: 5 }, () => randomLetters(4));
	return parts.join("-");
}

export async function POST(req: Request) {
	try {
		const { targetUserId, level } = await req.json();
		const nLevel = Number(level);
		if (!targetUserId || !/^\d+$/.test(String(targetUserId))) {
			return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });
		}
		if (![1, 2, 3].includes(nLevel)) {
			return NextResponse.json({ error: "Invalid level" }, { status: 400 });
		}
		const expiresAtMs = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

		// Ensure uniqueness (very unlikely to collide)
		let code = genCode();
		while (store.has(code)) code = genCode();

		store.set(code, { t: String(targetUserId), l: nLevel, e: expiresAtMs });

		return NextResponse.json({ code, expiresAt: new Date(expiresAtMs).toISOString(), level: nLevel });
	} catch {
		return NextResponse.json({ error: "Bad request" }, { status: 400 });
	}
}
