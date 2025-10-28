import { NextResponse } from "next/server";
import { verifySession } from "../../auth/_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const namesByLevel: Record<number, string> = {
	1: "Streetline",
	2: "Tandem Club",
	3: "Pro Line",
};

export async function POST(req: Request) {
	const body = await req.json().catch(() => null) as { token?: string } | null;
	const token = (body?.token || "").trim();
	if (!token) return NextResponse.json({ ok: false, status: "missing" }, { status: 400 });

	const payload = verifySession(token);
	if (!payload || (payload as any).type !== "gift") {
		return NextResponse.json({ ok: false, status: "invalid" }, { status: 400 });
	}

	const level = Number((payload as any).level);
	const targetUserId = String((payload as any).targetUserId || "");
	const exp = Number((payload as any).exp || 0);

	if (!(level >= 1 && level <= 3) || !targetUserId) {
		return NextResponse.json({ ok: false, status: "invalid" }, { status: 400 });
	}
	if (!exp || Date.now() > exp) {
		return NextResponse.json({ ok: false, status: "expired" }, { status: 400 });
	}

	const tierName = namesByLevel[level] || `Tier ${level}`;
	return NextResponse.json({ ok: true, level, targetUserId, tierName, expiresAt: exp });
}
