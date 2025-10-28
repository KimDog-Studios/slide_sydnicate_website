import { NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const stripe = STRIPE_KEY
	? new Stripe(STRIPE_KEY, { apiVersion: "2025-09-30.clover" })
	: null;

function baseUrlFromRequest(req: Request) {
	// Prefer env; fallback to request origin
	const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
	if (envBase) return envBase.replace(/\/+$/, "");
	const u = new URL(req.url);
	return u.origin;
}

function env(name: string) {
	const v = process.env[name];
	return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function pickPriceId(level: number, billing: "monthly" | "annually") {
	// Preferred names
	const monthly: Record<number, string | undefined> = {
		1: env("STRIPE_PRICE_TIER_1"),
		2: env("STRIPE_PRICE_TIER_2"),
		3: env("STRIPE_PRICE_TIER_3"),
	};
	const annual: Record<number, string | undefined> = {
		1: env("STRIPE_PRICE_TIER_1_ANNUAL"),
		2: env("STRIPE_PRICE_TIER_2_ANNUAL"),
		3: env("STRIPE_PRICE_TIER_3_ANNUAL"),
	};
	// Legacy fallback if you had older names
	const legacyMonthly: Record<number, string | undefined> = {
		1: env("STRIPE_PRICE_TIER1_ID"),
		2: env("STRIPE_PRICE_TIER2_ID"),
		3: env("STRIPE_PRICE_TIER3_ID"),
	};

	if (billing === "annually" && annual[level]?.startsWith("price_")) return annual[level];
	return monthly[level] || legacyMonthly[level];
}

export async function POST(req: Request) {
	if (!stripe) {
		return NextResponse.json({ error: "Stripe not configured. Set STRIPE_SECRET_KEY." }, { status: 500 });
	}
	try {
		const body = await req.json().catch(() => ({}));
		const level = Number(body?.level);
		const billing: "monthly" | "annually" = body?.billing === "annually" ? "annually" : "monthly";
		if (![1, 2, 3].includes(level)) {
			return NextResponse.json({ error: "Invalid tier level." }, { status: 400 });
		}
		const priceId = pickPriceId(level, billing);
		if (!priceId?.startsWith("price_")) {
			return NextResponse.json(
				{ error: "Missing Stripe price for this tier. Set STRIPE_PRICE_TIER_{LEVEL} to a price_... ID." },
				{ status: 400 }
			);
		}
		const base = baseUrlFromRequest(req);
		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${base}/checkout?level=${encodeURIComponent(level)}&billing=${encodeURIComponent(billing)}&currency=USD`,
			// allow_promotion_codes: true,
			// automatic_tax: { enabled: true },
		});
		return NextResponse.json({ url: session.url }, { status: 200 });
	} catch (e: any) {
		console.error("Stripe checkout error:", e);
		return NextResponse.json({ error: e?.message || "Stripe error" }, { status: 500 });
	}
}
