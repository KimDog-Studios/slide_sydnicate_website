import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const hdrs = nextHeaders();
	const proto = url.protocol || (((await hdrs).get("x-forwarded-proto") || "https") + ":");
	const host = url.host || (await hdrs).get("host") || "";
	const origin = `${proto}//${host}`;
	const returnTo = `${origin}/api/steam/auth/callback`;

	const params = new URLSearchParams({
		"openid.ns": "http://specs.openid.net/auth/2.0",
		"openid.mode": "checkid_setup",
		"openid.return_to": returnTo,
		"openid.realm": origin,
		"openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
		"openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
	});

	return NextResponse.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`);
}
