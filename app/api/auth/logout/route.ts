import { NextResponse } from "next/server";

const COOKIE_NAME = "ss_session";

export async function POST(req: Request) {
  const { origin } = new URL(req.url);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    expires: new Date(0),
  });
  // Optionally redirect:
  // return NextResponse.redirect(new URL("/", origin), { headers: res.headers });
  return res;
}
