import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { COOKIE_NAME, verifySession } from "../../auth/_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const PRICE_1 = process.env.STRIPE_PRICE_TIER1_ID || "";
const PRICE_2 = process.env.STRIPE_PRICE_TIER2_ID || "";
const PRICE_3 = process.env.STRIPE_PRICE_TIER3_ID || "";
const GUILD_ID = process.env.DISCORD_GUILD_ID || "";

const priceForLevel = (level: number) => {
	switch (level) {
		case 1: return PRICE_1;
		case 2: return PRICE_2;
		case 3: return PRICE_3;
		default: return "";
	}
};

export async function POST(req: Request) {
	if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
	const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

	const url = new URL(req.url);
	const origin = url.origin;

	const jar = cookies();
	const token = (await jar).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	if (!sess?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json().catch(() => null) as { level?: number } | null;
	const level = typeof body?.level === "number" ? body.level! : NaN;
	if (!(level >= 1 && level <= 3)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

	const priceId = priceForLevel(level);
	if (!priceId) return NextResponse.json({ error: "Price not set" }, { status: 500 });

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			line_items: [{ price: priceId, quantity: 1 }],
			allow_promotion_codes: true,
			client_reference_id: String(sess.id),
			metadata: { level: String(level), userId: String(sess.id), guildId: GUILD_ID },
			success_url: `${origin}/api/checkout/claim?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/?canceled=1`,
		});
		return NextResponse.json({ url: session.url });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Stripe error" }, { status: 500 });
	}
}
