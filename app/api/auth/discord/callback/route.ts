import { NextResponse } from "next/server";
import crypto from "crypto";
export const dynamic = "force-dynamic";

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
};

const COOKIE_NAME = "ss_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function b64url(data: Buffer | string) {
  const b = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function signSession(payload: object, secret: string) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/?error=missing_code", origin));
    }

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
    const redirectUri =
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${origin}/api/auth/discord/callback`;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!clientId || !clientSecret || !sessionSecret) {
      return NextResponse.redirect(new URL("/?error=server_config", origin));
    }

    // Exchange code -> token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", origin));
    }
    const tokenJson = await tokenRes.json();
    const accessToken: string | undefined = tokenJson?.access_token;
    if (!accessToken) {
      return NextResponse.redirect(new URL("/?error=no_access_token", origin));
    }

    // Fetch user
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/?error=user_fetch_failed", origin));
    }
    const rawUser = (await userRes.json()) as DiscordUser;

    const avatarUrl =
      rawUser.avatar
        ? `https://cdn.discordapp.com/avatars/${rawUser.id}/${rawUser.avatar}.png`
        : undefined;

    // Build session
    const now = Math.floor(Date.now() / 1000);
    const exp = now + COOKIE_MAX_AGE;
    const session = {
      sub: rawUser.id,
      username: rawUser.username,
      displayName: rawUser.global_name ?? rawUser.username,
      email: rawUser.email ?? null,
      avatar: avatarUrl ?? null,
      iat: now,
      exp,
      provider: "discord",
    };

    const token = signSession(session, sessionSecret);

    const redirect = NextResponse.redirect(new URL("/", origin));
    redirect.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return redirect;
  } catch {
    const { origin } = new URL(req.url);
    return NextResponse.redirect(new URL("/?error=unexpected", origin));
  }
}
