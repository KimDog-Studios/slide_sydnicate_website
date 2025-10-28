import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { COOKIE_NAME, signSession, verifySession } from "../../auth/_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

const ROLE_MAP: Record<number, string | undefined> = {
	1: process.env.DISCORD_ROLE_TIER1_ID,
	2: process.env.DISCORD_ROLE_TIER2_ID,
	3: process.env.DISCORD_ROLE_TIER3_ID,
};
const GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

async function addRole(userId: string, roleId: string) {
	if (!BOT_TOKEN || !GUILD_ID) throw new Error("Bot not configured");
	// add role
	const r = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, {
		method: "PUT",
		headers: { Authorization: `Bot ${BOT_TOKEN}` },
	});
	if (r.status !== 204) throw new Error(`Discord add role failed (${r.status})`);
	// remove other tier roles
	for (const [lvl, rid] of Object.entries(ROLE_MAP)) {
		if (rid && rid !== roleId) {
			await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${rid}`, {
				method: "DELETE",
				headers: { Authorization: `Bot ${BOT_TOKEN}` },
			}).catch(() => {});
		}
	}
}

export async function GET(req: Request) {
	if (!stripeKey) return NextResponse.redirect(new URL("/?error=stripe_config", req.url));
	const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

	const u = new URL(req.url);
	const session_id = u.searchParams.get("session_id");
	if (!session_id) return NextResponse.redirect(new URL("/?error=missing_session", req.url));

	let cs: Stripe.Checkout.Session | null = null;
	try {
		cs = await stripe.checkout.sessions.retrieve(session_id, { expand: ["subscription"] });
	} catch {
		return NextResponse.redirect(new URL("/?error=retrieve_failed", req.url));
	}

	// Validate payment/subscription
	const level = Number(cs.metadata?.level || NaN);
	const targetUserId = String(cs.metadata?.userId || cs.client_reference_id || "");
	if (!(level >= 1 && level <= 3) || !targetUserId) {
		return NextResponse.redirect(new URL("/?error=bad_meta", req.url));
	}

	// subscription must be active or checkout paid
	const sub = cs.subscription as Stripe.Subscription | null;
	const paidOk =
		(cs.mode === "subscription" && sub && ["active", "trialing"].includes(sub.status)) ||
		(cs.mode === "payment" && cs.payment_status === "paid");
	if (!paidOk) {
		return NextResponse.redirect(new URL("/?error=unpaid", req.url));
	}

	const roleId = ROLE_MAP[level];
	if (!roleId) return NextResponse.redirect(new URL("/?error=role_not_set", req.url));

	// Try grant role
	try {
		await addRole(targetUserId, roleId);
	} catch {
		// If member not in guild: show helpful error
		return NextResponse.redirect(new URL("/?error=join_guild_first", req.url));
	}

	// If current session belongs to same user, bump the cookie tier
	const jar = cookies();
	const token = (await jar).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	if (sess?.id && String(sess.id) === targetUserId) {
		const updated = signSession({ ...sess, tier: level === 1 ? "Streetline" : level === 2 ? "Tandem Club" : "Pro Line", ts: Date.now() });
		const res = NextResponse.redirect(new URL("/?purchase=success", req.url));
		res.cookies.set(COOKIE_NAME, updated, {
			httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
		});
		return res;
	}

	return NextResponse.redirect(new URL("/?purchase=success", req.url));
}
