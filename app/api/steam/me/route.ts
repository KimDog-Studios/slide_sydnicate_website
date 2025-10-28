import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";

type SessionShape = {
	authenticated?: boolean;
	accessToken?: string;
	discordAccessToken?: string;
	user?: {
		id?: string | number;
		accessToken?: string;
		discordAccessToken?: string;
	} | null;
};

async function getCookie(name: string) {
	try {
		return (await cookies()).get(name)?.value ?? null;
	} catch { return null; }
}

export async function GET(req: Request) {
	try {
		// Resolve origin to call internal session route
		const url = new URL(req.url);
		const hdrs = nextHeaders();
		const proto = url.protocol || (((await hdrs).get("x-forwarded-proto") || "https") + ":");
		const host = url.host || (await hdrs).get("host") || "";
		const origin = `${proto}//${host}`;

		// Load session to get user token (bearer for Discord connections)
		let token: string | null = null;
		try {
			const r = await fetch(`${origin}/api/auth/session`, {
				method: "GET",
				cache: "no-store",
				credentials: "include",
				headers: { Cookie: (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join("; ") },
			});
			const s = r.ok ? await r.json() as SessionShape : null;
			token =
				(s?.user?.discordAccessToken as string) ||
				(s?.user?.accessToken as string) ||
				(s?.discordAccessToken as string) ||
				(s?.accessToken as string) ||
				null;
		} catch {}

		// Try Discord connections if we have a token
		if (token) {
			try {
				const dr = await fetch("https://discord.com/api/users/@me/connections", {
					headers: { Authorization: `Bearer ${token}` },
					cache: "no-store",
				});
				if (dr.ok) {
					const conns = await dr.json() as Array<{ type: string; id: string; name?: string }>;
					const steam = conns.find(c => c.type === "steam");
					if (steam?.id) {
						return NextResponse.json(
							{ id: steam.id, name: steam.name ?? null, source: "discord" },
							{ status: 200, headers: { "Cache-Control": "no-store" } }
						);
					}
				}
			} catch {}
		}

		// Fallback: cookie set by Steam OpenID callback
		const raw = await getCookie("steam_link");
		if (raw) {
			try {
				const data = JSON.parse(raw) as { id?: string; name?: string | null };
				if (data?.id) {
					return NextResponse.json(
						{ id: data.id, name: data.name ?? null, source: "cookie" },
						{ status: 200, headers: { "Cache-Control": "no-store" } }
					);
				}
			} catch {}
		}

		return NextResponse.json({ id: null, name: null, source: null }, { status: 200, headers: { "Cache-Control": "no-store" } });
	} catch {
		return NextResponse.json({ id: null, name: null, source: null }, { status: 200, headers: { "Cache-Control": "no-store" } });
	}
}
