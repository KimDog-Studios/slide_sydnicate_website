import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MAIN upstream host (fallback to provided IP)
const MAIN_HOST = (process.env.MAIN_HOST?.trim() || "45.141.36.126");

// CORS helper
const corsHeaders = (extra?: Record<string, string>) => ({
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET,OPTIONS",
	"access-control-allow-headers": "Content-Type,Accept",
	"cache-control": "no-store",
	...(extra ?? {}),
});

// IPv4 to int for range checks
const v4ToInt = (ip: string) => ip.split(".").reduce((a, o) => (a << 8) + (parseInt(o, 10) & 255), 0) >>> 0;
const inRangeV4 = (ip: string, cidr: string) => {
	const [base, maskStr] = cidr.split("/");
	const mask = 0xffffffff << (32 - parseInt(maskStr, 10));
	const ipInt = v4ToInt(ip);
	const baseInt = v4ToInt(base);
	// eslint-disable-next-line no-bitwise
	return (ipInt & mask) === (baseInt & mask);
};
const isPrivateIp = (ip: string) => {
	const v = net.isIP(ip);
	if (v === 4) {
		return (
			inRangeV4(ip, "10.0.0.0/8") ||
			inRangeV4(ip, "172.16.0.0/12") ||
			inRangeV4(ip, "192.168.0.0/16") ||
			inRangeV4(ip, "127.0.0.0/8") ||       // loopback
			inRangeV4(ip, "169.254.0.0/16") ||    // link-local
			inRangeV4(ip, "100.64.0.0/10") ||     // CGNAT
			inRangeV4(ip, "192.0.0.0/24") ||      // IETF Protocol Assignments
			inRangeV4(ip, "192.0.2.0/24") ||      // TEST-NET-1
			inRangeV4(ip, "198.51.100.0/24") ||   // TEST-NET-2
			inRangeV4(ip, "203.0.113.0/24")       // TEST-NET-3
		);
	}
	if (v === 6) {
		const low = ip.toLowerCase();
		return (
			low === "::1" ||                        // loopback
			low.startsWith("fe80:") ||              // link-local
			low.startsWith("fc") || low.startsWith("fd") // unique-local
		);
	}
	return false;
};

async function blockIfPrivate(target: URL) {
	const host = target.hostname.toLowerCase();
	// obvious disallowed names
	if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
		throw new Error("blocked_hostname");
	}
	// ip literal
	if (net.isIP(host)) {
		if (isPrivateIp(host)) throw new Error("blocked_ip");
		return;
	}
	// resolve and verify all ips are public
	const addrs = await dns.lookup(host, { all: true, verbatim: true });
	for (const a of addrs) {
		if (isPrivateIp(a.address)) throw new Error("blocked_resolved_ip");
	}
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const u = url.searchParams.get("u");
	const t = url.searchParams.get("t");
	// quiet mode: if enabled, suppress error status codes (return 204)
	// default is quiet unless q=0 explicitly
	const q = url.searchParams.get("q");
	const quiet = (q ?? "1") !== "0";
	// optional max size guard (bytes). Default 2MB, clamp 16KB..5MB
	const max = Math.min(5_000_000, Math.max(16_000, Number.parseInt(url.searchParams.get("max") || "", 10) || 2_000_000));
	// optional Accept override
	const acceptOverride = url.searchParams.get("a") || "";

	// Builder mode: allow constructing URL with main host + port + path when 'u' is omitted.
	// Example: /api/proxy?p=8081&path=/info&proto=http
	let rawU = u || "";
	if (!rawU) {
		const pParam = url.searchParams.get("p");
		const pathParam = (url.searchParams.get("path") || "").trim();
		const schemeParam = (url.searchParams.get("proto") || url.searchParams.get("scheme") || "http").toLowerCase();
		if (pParam) {
			const portNum = Number.parseInt(pParam, 10);
			if (!Number.isFinite(portNum) || portNum <= 0 || portNum > 65535) {
				return NextResponse.json({ error: "invalid port" }, { status: 400, headers: corsHeaders() });
			}
			const proto = schemeParam === "https" ? "https" : "http";
			const normalizedPath = pathParam ? (pathParam.startsWith("/") ? pathParam : `/${pathParam}`) : "/info";
			rawU = `${proto}://${MAIN_HOST}:${portNum}${normalizedPath}`;
		}
	}

	if (!rawU) return NextResponse.json({ error: "missing u" }, { status: 400, headers: corsHeaders() });

	let target: URL;
	try {
		target = new URL(rawU);
	} catch {
		return NextResponse.json({ error: "invalid url" }, { status: 400, headers: corsHeaders() });
	}
	if (target.protocol !== "http:" && target.protocol !== "https:") {
		return NextResponse.json({ error: "invalid protocol" }, { status: 400, headers: corsHeaders() });
	}
	// port guard
	const port = target.port ? parseInt(target.port, 10) : (target.protocol === "http:" ? 80 : 443);
	if (!Number.isFinite(port) || port <= 0 || port > 65535) {
		return NextResponse.json({ error: "invalid port" }, { status: 400, headers: corsHeaders() });
	}

	// SSRF guard (block private/reserved)
	try {
		await blockIfPrivate(target);
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "blocked" }, { status: 400, headers: corsHeaders() });
	}

	// Server-side timeout; default is longer for MAIN_HOST
	const defaultT = target.hostname === MAIN_HOST ? 15000 : 10000;
	const tms = Math.min(25000, Math.max(500, Number.parseInt(t || "", 10) || defaultT));
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), tms);

	try {
		const upstream = await fetch(target.toString(), {
			cache: "no-store",
			redirect: "follow",
			headers: {
				Accept: acceptOverride || req.headers.get("accept") || "application/json, text/plain;q=0.9, */*;q=0.8",
				"User-Agent": "SlideSyndicateProxy/1.0 (+servers)",
			},
			signal: controller.signal,
		});

		// Enforce size guard if Content-Length present
		const cl = upstream.headers.get("content-length");
		if (cl && Number.isFinite(Number(cl)) && Number(cl) > max) {
			return NextResponse.json({ error: "upstream_too_large", contentLength: Number(cl), max }, { status: 413, headers: corsHeaders() });
		}

		// Forward essential headers, force no-store and CORS
		const headers = new Headers();
		const ct = upstream.headers.get("content-type");
		if (ct) headers.set("content-type", ct);
		headers.set("cache-control", "no-store");
		headers.set("access-control-allow-origin", "*");
		headers.set("access-control-allow-methods", "GET,OPTIONS");
		headers.set("access-control-allow-headers", "Content-Type,Accept");
		headers.set("vary", "accept");
		headers.set("x-proxy-t", String(tms));
		if (target.hostname === MAIN_HOST) headers.set("x-proxy-main", "1");

		return new Response(upstream.body, {
			status: upstream.status,
			headers,
		});
	} catch (e: any) {
		const aborted = e?.name === "AbortError";
		if (quiet) {
			// no body, no error — prevents noisy 5xx logs
			return new Response(null, {
				status: 204,
				headers: corsHeaders(),
			});
		}
		return NextResponse.json(
			{
				error: aborted ? "proxy_timeout" : "proxy_error",
				message: e?.message ?? String(e),
				tms,
				target: target.toString(),
			},
			{ status: aborted ? 504 : 502, headers: corsHeaders() }
		);
	} finally {
		clearTimeout(timer);
	}
}
