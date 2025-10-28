import { NextResponse } from "next/server";

// Global in-memory store (must match create route usage)
declare global {
	// eslint-disable-next-line no-var
	var __giftStore: Map<string, { t: string; l: number; e: number }> | undefined;
}
const store = globalThis.__giftStore ?? (globalThis.__giftStore = new Map());

// Discord env
const BOT = process.env.DISCORD_BOT_TOKEN || "";
const GUILD = process.env.DISCORD_GUILD_ID || "";
const ROLE_TIER1 = process.env.DISCORD_ROLE_TIER1_ID || "";
const ROLE_TIER2 = process.env.DISCORD_ROLE_TIER2_ID || "";
const ROLE_TIER3 = process.env.DISCORD_ROLE_TIER3_ID || "";

// Get current user id from your session API
async function getUserIdFromSession(req: Request): Promise<string | null> {
	try {
		const origin = process.env.NEXT_PUBLIC_BASE_URL || "";
		const r = await fetch(`${origin}/api/auth/session`, {
			method: "GET",
			headers: { cookie: req.headers.get("cookie") || "" },
			cache: "no-store",
		});
		if (!r.ok) return null;
		const j = await r.json();
		return j?.user?.id ? String(j.user.id) : null;
	} catch {
		return null;
	}
}

export async function POST(req: Request) {
	if (!BOT || !GUILD) {
		return NextResponse.json({ error: "Server not configured" }, { status: 500 });
	}
	try {
		const { code } = await req.json();
		if (!code || typeof code !== "string") {
			return NextResponse.json({ error: "Invalid code" }, { status: 400 });
		}

		const entry = store.get(code);
		if (!entry) return NextResponse.json({ error: "Code not found" }, { status: 404 });
		if (Date.now() > entry.e) {
			store.delete(code);
			return NextResponse.json({ error: "Code expired" }, { status: 400 });
		}

		const sessionUserId = await getUserIdFromSession(req);
		if (!sessionUserId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
		if (String(sessionUserId) !== entry.t) {
			return NextResponse.json({ error: "This code is not for your account" }, { status: 403 });
		}

		// Map level -> role and grant
		const roleId = entry.l === 3 ? ROLE_TIER3 : entry.l === 2 ? ROLE_TIER2 : entry.l === 1 ? ROLE_TIER1 : "";
		if (!roleId) return NextResponse.json({ error: "Tier role not configured" }, { status: 500 });

		const put = await fetch(`https://discord.com/api/v10/guilds/${GUILD}/members/${encodeURIComponent(sessionUserId)}/roles/${roleId}`, {
			method: "PUT",
			headers: { Authorization: `Bot ${BOT}` },
			cache: "no-store",
		});
		if (put.status !== 204) {
			return NextResponse.json({ error: "Failed to grant role" }, { status: 200 });
		}

		// Invalidate code after successful redemption
		store.delete(code);
		return NextResponse.json({ ok: true, level: entry.l });
	} catch {
		return NextResponse.json({ error: "Bad request" }, { status: 400 });
	}
}
