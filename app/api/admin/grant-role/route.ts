import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "../../auth/_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const ADMIN_ROLE_ID = (process.env.DISCORD_ADMIN_ROLE_ID || "").trim();
const ADMIN_SECRET = (process.env.ADMIN_SECRET || "").trim();

const ROLE_MAP: Record<number, string | undefined> = {
	0: process.env.DISCORD_ROLE_TIER0_ID,
	1: process.env.DISCORD_ROLE_TIER1_ID,
	2: process.env.DISCORD_ROLE_TIER2_ID,
	3: process.env.DISCORD_ROLE_TIER3_ID,
};

async function isAuthorizedByRole(userId: string) {
	if (!GUILD_ID || !BOT_TOKEN || !ADMIN_ROLE_ID) return false;
	try {
		const res = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
			headers: { Authorization: `Bot ${BOT_TOKEN}` },
			cache: "no-store",
		});
		if (!res.ok) return false;
		const member = await res.json().catch(() => null) as { roles?: string[] } | null;
		const roles = Array.isArray(member?.roles) ? member!.roles : [];
		return roles.includes(ADMIN_ROLE_ID);
	} catch {
		return false;
	}
}

export async function POST(req: Request) {
	const jar = cookies();
	const token = (await jar).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	const hdrSecret = req.headers.get("x-admin-secret") || "";
	const authedBySecret = ADMIN_SECRET && hdrSecret && hdrSecret === ADMIN_SECRET;
	const authedByRole = sess?.id ? await isAuthorizedByRole(String(sess.id)) : false;

	if (!authedBySecret && !authedByRole) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!GUILD_ID || !BOT_TOKEN) return NextResponse.json({ error: "Bot not configured" }, { status: 500 });

	const body = await req.json().catch(() => null) as { targetUserId?: string; level?: number } | null;
	const targetUserId = (body?.targetUserId || "").trim();
	const level = typeof body?.level === "number" ? body!.level : NaN;
	if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
	if (!(level >= 0 && level <= 3)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

	const roleId = ROLE_MAP[level];
	if (!roleId) return NextResponse.json({ error: "Tier role not configured" }, { status: 400 });

	// Ensure member exists
	const member = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${targetUserId}`, {
		headers: { Authorization: `Bot ${BOT_TOKEN}` },
		cache: "no-store",
	});
	if (member.status !== 200) {
		return NextResponse.json({ error: "User not in guild. Ask them to join first." }, { status: 400 });
	}

	// Grant role
	const add = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${targetUserId}/roles/${roleId}`, {
		method: "PUT",
		headers: { Authorization: `Bot ${BOT_TOKEN}` },
	});
	if (add.status !== 204) {
		const text = await add.text().catch(() => "");
		return NextResponse.json({ error: `Failed to add role (${add.status}) ${text}` }, { status: 500 });
	}

	// Remove other tier roles
	for (const rid of Object.values(ROLE_MAP)) {
		if (rid && rid !== roleId) {
			await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${targetUserId}/roles/${rid}`, {
				method: "DELETE",
				headers: { Authorization: `Bot ${BOT_TOKEN}` },
			}).catch(() => {});
		}
	}

	return NextResponse.json({ ok: true });
}
