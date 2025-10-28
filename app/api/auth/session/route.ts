import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "../_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const token = (await cookies()).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	if (!sess) return NextResponse.json({ authenticated: false }, { status: 200 });
	// Only return id, displayName, avatar (no tier)
	return NextResponse.json(
		{
			authenticated: true,
			user: {
				id: String(sess.id),
				displayName: String(sess.displayName),
				avatar: sess.avatar ?? null,
				tier: sess.tier ?? null,
			},
		},
		{ status: 200 }
	);
}
