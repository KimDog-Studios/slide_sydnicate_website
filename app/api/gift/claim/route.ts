import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, signSession, verifySession } from "../../auth/_lib/session";
import { giftUsedStore } from "../_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const ROLE_MAP: Record<number, string | undefined> = {
	1: process.env.DISCORD_ROLE_TIER1_ID,
	2: process.env.DISCORD_ROLE_TIER2_ID,
	3: process.env.DISCORD_ROLE_TIER3_ID,
};

async function addRole(userId: string, roleId: string) {
	if (!BOT_TOKEN || !GUILD_ID) throw new Error("Bot not configured");
	const r = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, {
		method: "PUT",
		headers: { Authorization: `Bot ${BOT_TOKEN}` },
	});
	if (r.status !== 204) throw new Error(`Discord add role failed (${r.status})`);
	// remove other tier roles
	for (const rid of Object.values(ROLE_MAP)) {
		if (rid && rid !== roleId) {
			await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${rid}`, {
				method: "DELETE",
				headers: { Authorization: `Bot ${BOT_TOKEN}` },
			}).catch(() => {});
		}
	}
}

export async function GET(req: Request) {
	const u = new URL(req.url);
	const tok = u.searchParams.get("token") || "";
	if (!tok) return NextResponse.redirect(new URL("/gift/redeem?status=missing", req.url));

	const payload = verifySession(tok);
	if (!payload || payload.type !== "gift") return NextResponse.redirect(new URL("/gift/redeem?status=invalid", req.url));
	if (!payload.level || !payload.targetUserId || !payload.exp || Date.now() > Number(payload.exp)) {
		return NextResponse.redirect(new URL("/gift/redeem?status=expired", req.url));
	}
	const tid = String((payload as any).tid || "");
	if (!tid) return NextResponse.redirect(new URL("/gift/redeem?status=invalid", req.url));
	// Single-use check
	if (giftUsedStore.has(tid)) {
		return NextResponse.redirect(new URL("/gift/redeem?status=used", req.url));
	}
	// Mark as used on first hit (single-use semantics even if granting fails)
	giftUsedStore.add(tid);

	const roleId = ROLE_MAP[Number(payload.level)];
	if (!roleId) return NextResponse.redirect(new URL("/gift/redeem?status=role_not_set", req.url));

	try {
		await addRole(String(payload.targetUserId), roleId);
	} catch {
		return NextResponse.redirect(new URL("/gift/redeem?status=join_guild_first", req.url));
	}

	// If the current cookie belongs to the granted user, update their tier in session
	const jar = cookies();
	const cookieToken = (await jar).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(cookieToken);
	if (sess?.id && String(sess.id) === String(payload.targetUserId)) {
		const label = Number(payload.level) === 1 ? "Streetline" : Number(payload.level) === 2 ? "Tandem Club" : "Pro Line";
		const updated = signSession({ ...sess, tier: label, ts: Date.now() });
		const res = NextResponse.redirect(new URL("/gift/redeem?status=success", req.url));
		res.cookies.set(COOKIE_NAME, updated, {
			httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
		});
		return res;
	}

	return NextResponse.redirect(new URL("/gift/redeem?status=success", req.url));
}
