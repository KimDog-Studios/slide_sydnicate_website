import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";

const STEAM_OPENID = "https://steamcommunity.com/openid/login";
const STEAM_WEB_API_KEY = process.env.STEAM_WEB_API_KEY || "";

export async function GET(req: Request) {
	const url = new URL(req.url);

	// Build verification payload from query
	const q = url.searchParams;
	const verify = new URLSearchParams();
	q.forEach((v, k) => verify.append(k, v));
	verify.set("openid.mode", "check_authentication");

	// Verify with Steam
	let valid = false;
	try {
		const vr = await fetch(STEAM_OPENID, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: verify.toString(),
			cache: "no-store",
		});
		const text = await vr.text();
		valid = vr.ok && /is_valid\s*:\s*true/i.test(text);
	} catch {}

	if (!valid) {
		return NextResponse.redirect("/profile?steam=fail");
	}

	// Extract steamid from claimed_id
	const claimed = q.get("openid.claimed_id") || "";
	const match = claimed.match(/\/id\/(\d+)$/) || claimed.match(/\/profiles\/(\d+)$/) || claimed.match(/(\d+)\s*$/);
	const steamId = match?.[1] || null;

	if (!steamId) {
		return NextResponse.redirect("/profile?steam=fail");
	}

	// Optional: fetch persona name
	let name: string | null = null;
	if (STEAM_WEB_API_KEY) {
		try {
			const r = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(STEAM_WEB_API_KEY)}&steamids=${encodeURIComponent(steamId)}`, { cache: "no-store" });
			const j = await r.json();
			name = j?.response?.players?.[0]?.personaname ?? null;
		} catch {}
	}

	// Store in a secure cookie (server will expose via /api/steam/me)
	try {
		(await cookies()).set("steam_link", JSON.stringify({ id: steamId, name }), {
			httpOnly: true,
			secure: true,
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});
	} catch {}

	// Redirect back to profile
	const hdrs = nextHeaders();
	const proto = url.protocol || (((await hdrs).get("x-forwarded-proto") || "https") + ":");
	const host = url.host || (await hdrs).get("host") || "";
	const origin = `${proto}//${host}`;
	return NextResponse.redirect(`${origin}/profile?steam=ok`);
}
