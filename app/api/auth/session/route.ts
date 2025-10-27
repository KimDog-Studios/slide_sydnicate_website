import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "../_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const jar = await cookies();
	const token = jar.get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	if (!sess) {
		return NextResponse.json({ authenticated: false }, { status: 200 });
	}
	return NextResponse.json(
		{
			authenticated: true,
			user: { displayName: sess.displayName, avatar: sess.avatar, id: sess.id },
		},
		{ status: 200 }
	);
}
