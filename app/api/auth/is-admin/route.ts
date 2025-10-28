import { NextResponse } from "next/server";

const BOT = process.env.DISCORD_BOT_TOKEN || "";
const GUILD = process.env.DISCORD_GUILD_ID || "";
const ADMIN_ROLE_ID = process.env.DISCORD_ROLE_ADMIN_ID || "";

// Reuse the same session helper
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
	if (!BOT || !GUILD || !ADMIN_ROLE_ID) {
		// Fail-open to false if not configured
		return NextResponse.json({ isAdmin: false }, { status: 200 });
	}
	const userId = await getUserIdFromSession(req);
	if (!userId) return NextResponse.json({ isAdmin: false }, { status: 401 });

	const m = await fetch(`https://discord.com/api/v10/guilds/${GUILD}/members/${encodeURIComponent(userId)}`, {
		headers: { Authorization: `Bot ${BOT}` },
		cache: "no-store",
	});
	if (!m.ok) return NextResponse.json({ isAdmin: false }, { status: 200 });

	const mj = await m.json();
	const roles: string[] = Array.isArray(mj?.roles) ? mj.roles.map((r: any) => String(r)) : [];
	return NextResponse.json({ isAdmin: roles.includes(ADMIN_ROLE_ID) }, { status: 200 });
}
