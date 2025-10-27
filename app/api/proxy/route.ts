import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Note: Using global fetch pooling from Next.js runtime. No custom dispatcher.

export async function GET(req: Request) {
	const url = new URL(req.url);
	const u = url.searchParams.get("u");
	const t = url.searchParams.get("t");
	// quiet mode: if enabled, suppress error status codes (return 204)
	// default is quiet unless q=0 explicitly
	const q = url.searchParams.get("q");
	const quiet = (q ?? "1") !== "0";
	if (!u) return NextResponse.json({ error: "missing u" }, { status: 400, headers: { "access-control-allow-origin": "*" } });

	let target: URL;
	try {
		target = new URL(u);
	} catch {
		return NextResponse.json({ error: "invalid url" }, { status: 400, headers: { "access-control-allow-origin": "*" } });
	}
	if (target.protocol !== "http:" && target.protocol !== "https:") {
		return NextResponse.json({ error: "invalid protocol" }, { status: 400, headers: { "access-control-allow-origin": "*" } });
	}

	// Server-side timeout; default 10000ms, clamped 500..25000
	const tms = Math.min(25000, Math.max(500, Number.parseInt(t || "", 10) || 10000));
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), tms);

	try {
		const upstream = await fetch(new URL(u).toString(), {
			cache: "no-store",
			redirect: "follow",
			headers: {
				// align with other site, fallback if no client accept header
				Accept: req.headers.get("accept") || "application/json, text/plain;q=0.9, */*;q=0.8",
			},
			signal: controller.signal,
		});
		// Forward essential headers, force no-store and CORS
		const headers = new Headers();
		const ct = upstream.headers.get("content-type");
		if (ct) headers.set("content-type", ct);
		headers.set("cache-control", "no-store");
		headers.set("access-control-allow-origin", "*");

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
				headers: { "cache-control": "no-store", "access-control-allow-origin": "*" },
			});
		}
		return NextResponse.json(
			{
				error: aborted ? "proxy_timeout" : "proxy_error",
				message: e?.message ?? String(e),
				tms,
				target: new URL(u).toString(),
			},
			{ status: aborted ? 504 : 502, headers: { "access-control-allow-origin": "*" } }
		);
	} finally {
		clearTimeout(timer);
	}
}
