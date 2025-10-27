import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "ss_session";

function b64urlToBuf(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function safeJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function verifySession(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [bodyB64, sigB64] = parts;
  // Sign/verify over the same data: base64url string body
  const expectedSig = crypto.createHmac("sha256", secret).update(bodyB64).digest();
  const givenSig = b64urlToBuf(sigB64);
  if (givenSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, givenSig)) return null;
  const payload = safeJson<any>(b64urlToBuf(bodyB64).toString("utf8"));
  if (!payload) return null;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) return null;
  return payload;
}

export async function GET(req: Request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ authenticated: false }, { status: 500 });

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return NextResponse.json({ authenticated: false }, { status: 200 });

  const token = match[1];
  const payload = verifySession(token, secret);
  if (!payload) return NextResponse.json({ authenticated: false }, { status: 200 });

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: payload.sub,
        username: payload.username,
        displayName: payload.displayName,
        email: payload.email,
        avatar: payload.avatar,
        provider: payload.provider,
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
