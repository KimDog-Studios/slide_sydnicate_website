import { NextRequest, NextResponse } from "next/server";
import { isAllowedHref, newToken, saveToken, sweepExpired, hmac } from "@/lib/downloadTokens";

export async function POST(req: NextRequest) {
	try {
		sweepExpired();

		const body = await req.json().catch(() => ({}));
		const { href, id, type, title, requirements, bind } = body || {};

		// Basic validation
		if (!href || typeof href !== "string") {
			return NextResponse.json({ error: "Invalid href" }, { status: 400 });
		}
		if (!isAllowedHref(href)) {
			return NextResponse.json({ error: "Disallowed href host" }, { status: 400 });
		}
		const ttlSec = Math.max(5, Math.min(120, Number(requirements?.maxAgeSeconds) || 20));
		const oneTime = requirements?.oneTime !== false;

		// Bind data
		const ua = req.headers.get("user-agent") || "";
		const ip = getIp(req);
		const uaHash = hmac(ua);
		const ipHash = hmac(ip);
		const clientNonce = typeof bind?.clientNonce === "string" ? bind.clientNonce : "";

		if (!clientNonce) {
			return NextResponse.json({ error: "Missing client nonce" }, { status: 400 });
		}

		// Create token
		const token = newToken();
		const now = Date.now();
		saveToken({
			token,
			href,
			id,
			type,
			title,
			createdAt: now,
			expiresAt: now + ttlSec * 1000,
			usedAt: null,
			graceUntil: null,
			ipHash,
			uaHash,
			clientNonce,
		});

		// Build redeem URL
		const redeemUrl = new URL(`/api/downloads/redeem?token=${encodeURIComponent(token)}`, req.url).toString();

		// Set httpOnly cookie for nonce (bind to device/session, not readable by JS)
		const res = NextResponse.json({ oneTimeUrl: redeemUrl });
		res.cookies.set({
			name: "dl_nonce",
			value: clientNonce,
			httpOnly: true,
			secure: true,
			path: "/",
			maxAge: 60 * 60, // 1h
			sameSite: "lax",
		});

		// Harden response against caching
		res.headers.set("Cache-Control", "no-store, private");
		res.headers.set("Pragma", "no-cache");

		return res;
	} catch (e: any) {
		return NextResponse.json({ error: "Failed to issue link", detail: String(e?.message || e) }, { status: 500 });
	}
}

function getIp(req: NextRequest): string {
	// Prefer x-forwarded-for, else NextRequest.ip (Node adapter may leave null)
	const xff = req.headers.get("x-forwarded-for");
	if (xff) return xff.split(",")[0].trim();
	// @ts-ignore
	return (req as any).ip || "0.0.0.0";
}
