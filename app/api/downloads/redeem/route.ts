import { NextRequest, NextResponse } from "next/server";
import { getToken, revokeToken, sweepExpired, hmac, isAllowedHref } from "@/lib/downloadTokens";

export async function GET(req: NextRequest) {
	sweepExpired();

	const token = req.nextUrl.searchParams.get("token") || "";
	if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

	const rec = getToken(token);
	if (!rec) return NextResponse.json({ error: "Invalid or expired token" }, { status: 410 });

	const now = Date.now();
	if (now > rec.expiresAt && (!rec.graceUntil || now > rec.graceUntil)) {
		revokeToken(token);
		return NextResponse.json({ error: "Token expired" }, { status: 410 });
	}

	// Binding checks
	const ua = req.headers.get("user-agent") || "";
	const ip = getIp(req);
	const uaHash = hmac(ua);
	const ipHash = hmac(ip);
	const nonceCookie = req.cookies.get("dl_nonce")?.value || "";
	if (uaHash !== rec.uaHash || ipHash !== rec.ipHash || nonceCookie !== rec.clientNonce) {
		revokeToken(token);
		return NextResponse.json({ error: "Binding mismatch" }, { status: 403 });
	}

	// Strict single-use: revoke immediately on first valid redeem
	const href = rec.href;
	revokeToken(token);

	if (!isAllowedHref(href)) {
		return NextResponse.json({ error: "Blocked origin" }, { status: 400 });
	}

	const range = req.headers.get("range") || undefined;
	const upstreamHeaders: HeadersInit = { "User-Agent": "KimDog-Download-Proxy" };
	if (range) upstreamHeaders["Range"] = range;

	let upstream: Response;
	try {
		upstream = await fetch(href, {
			method: "GET",
			headers: upstreamHeaders,
			redirect: "follow",
			cache: "no-store",
		});
	} catch {
		return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
	}

	if (!upstream.ok && upstream.status !== 206) {
		return NextResponse.json({ error: "Upstream error", status: upstream.status }, { status: 502 });
	}

	const filename = safeFilenameFromUrl(href) || "download.bin";

	const res = new NextResponse(upstream.body, {
		status: upstream.status,
		headers: {
			"Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
			"Content-Length": upstream.headers.get("content-length") || "",
			"Content-Range": upstream.headers.get("content-range") || "",
			"Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
			"Cache-Control": "no-store, private",
			"Pragma": "no-cache",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Referrer-Policy": "no-referrer",
			"X-Content-Type-Options": "nosniff",
			"Cross-Origin-Resource-Policy": "same-origin",
		},
	});

	return res;
}

function getIp(req: NextRequest): string {
	const xff = req.headers.get("x-forwarded-for");
	if (xff) return xff.split(",")[0].trim();
	// @ts-ignore
	return (req as any).ip || "0.0.0.0";
}

function safeFilenameFromUrl(u: string): string {
	try {
		const pathname = new URL(u).pathname;
		const raw = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "download");
		return raw.replace(/[^\w.\-]+/g, "_").slice(0, 200);
	} catch {
		return "download";
	}
}
