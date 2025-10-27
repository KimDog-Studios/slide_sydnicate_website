import { NextResponse } from "next/server";
import { COOKIE_NAME } from "../_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
	const res = NextResponse.json({ ok: true });
	res.cookies.set(COOKIE_NAME, "", {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		expires: new Date(0),
	});
	return res;
}
