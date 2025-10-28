import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";

type SessionShape = {
	authenticated?: boolean;
	user?: { id?: string | number } | null;
};

const GUILD_ID = process.env.DISCORD_GUILD_ID || process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

// Map Discord role IDs to tier levels (set these env vars)
const ROLE_TIER_1 = process.env.DISCORD_TIER_ROLE_1 || "";
const ROLE_TIER_2 = process.env.DISCORD_TIER_ROLE_2 || "";
const ROLE_TIER_3 = process.env.DISCORD_TIER_ROLE_3 || "";
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID || "1217484465975070720";

// Utility to serialize request cookies for internal fetch
async function serializeCookies(): Promise<string> {
	try {
		return (await cookies())
			.getAll()
			.map((c) => `${c.name}=${c.value}`)
			.join("; ");
	} catch {
		return "";
	}
}

// Helper: try to get the current user's id from your existing session API
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

export async function GET(req: Request) {
	if (!BOT_TOKEN || !GUILD_ID) {
		return NextResponse.json(
			{ levels: [], roles: [], joinedAt: null, error: "Discord env not configured" },
			{ status: 200 }
		);
	}

	// Prefer session user; allow overriding via ?userId=
	const { searchParams } = new URL(req.url);
	let userId = searchParams.get("userId");
	if (!userId) userId = await getUserIdFromSession(req);
	if (!userId) {
		return NextResponse.json(
			{ levels: [], roles: [], joinedAt: null, error: "Unauthenticated" },
			{ status: 401 }
		);
	}

	// Fetch guild member from Discord
	const m = await fetch(
		`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${encodeURIComponent(userId)}`,
		{
			headers: { Authorization: `Bot ${BOT_TOKEN}` },
			cache: "no-store",
		}
	);

	if (m.status === 404) {
		// Not in guild
		return NextResponse.json({ levels: [], roles: [], joinedAt: null }, { status: 200 });
	}
	if (!m.ok) {
		return NextResponse.json(
			{ levels: [], roles: [], joinedAt: null, error: "Discord fetch failed" },
			{ status: 200 }
		);
	}

	const mj = await m.json();
	const roles: string[] = Array.isArray(mj?.roles) ? mj.roles.map((r: any) => String(r)) : [];
	const joinedAt: string | null = typeof mj?.joined_at === "string" ? mj.joined_at : null;

	// Map roles to levels
	const levels: number[] = [];
	if (ROLE_TIER_1 && roles.includes(ROLE_TIER_1)) levels.push(1);
	if (ROLE_TIER_2 && roles.includes(ROLE_TIER_2)) levels.push(2);
	if (ROLE_TIER_3 && roles.includes(ROLE_TIER_3)) levels.push(3);

	// Ensure unique/sorted
	const uniqLevels = Array.from(new Set(levels)).sort((a, b) => a - b);

	return NextResponse.json({
		levels: uniqLevels,
		roles,
		joinedAt,
		isVerified: roles.includes(VERIFIED_ROLE_ID),
	});
}
