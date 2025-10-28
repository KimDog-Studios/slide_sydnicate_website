import { NextResponse } from "next/server";
import { COOKIE_NAME, signSession } from "../../_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	if (!code) return NextResponse.redirect(new URL("/?error=missing_code", url));

	const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "";
	const clientSecret = process.env.DISCORD_CLIENT_SECRET || "";
	if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/?error=server_config", url));

	// Must match authorize redirect_uri exactly; your env points to site root
	const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${url.origin}/`;

	// Exchange code
	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
	});
	let accessToken = "";
	try {
		const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		const tokenJson = await tokenRes.json().catch(() => null);
		if (!tokenRes.ok || !tokenJson?.access_token) {
			return NextResponse.redirect(new URL("/?error=token_exchange", url));
		}
		accessToken = tokenJson.access_token as string;
	} catch {
		return NextResponse.redirect(new URL("/?error=token_fetch", url));
	}

	// Fetch user
	let user: any = null;
	try {
		const uRes = await fetch("https://discord.com/api/users/@me", {
			headers: { Authorization: `Bearer ${accessToken}` },
			cache: "no-store",
		});
		user = await uRes.json().catch(() => null);
		if (!uRes.ok || !user?.id) return NextResponse.redirect(new URL("/?error=user_fetch", url));
	} catch {
		return NextResponse.redirect(new URL("/?error=user_fetch", url));
	}

	const displayName = user.global_name || user.username || "User";
	const avatarUrl = user.avatar
		? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
		: null;

	const session = signSession({
		id: String(user.id),
		displayName,
		avatar: avatarUrl,
		tier: "Beginner Access",
		accessToken, // needed for guilds.join in REST mode
		ts: Date.now(),
	});

	const res = NextResponse.redirect(new URL("/", url));
	res.cookies.set(COOKIE_NAME, session, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
	});
	return res;
}
