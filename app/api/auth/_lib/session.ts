import crypto from "crypto";

export const COOKIE_NAME = "ss_session";

const base64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

function getSecret() {
	const secret = process.env.SESSION_SECRET || "";
	if (!secret) throw new Error("SESSION_SECRET missing");
	return secret;
}

export function signSession(payload: any): string {
	const json = Buffer.from(JSON.stringify(payload));
	const data = base64url(json);
	const h = crypto.createHmac("sha256", getSecret()).update(data).digest();
	const sig = base64url(h);
	return `${data}.${sig}`;
}

export function verifySession(token?: string | null): any | null {
	if (!token || typeof token !== "string" || !token.includes(".")) return null;
	const [data, sig] = token.split(".");
	const expected = base64url(crypto.createHmac("sha256", getSecret()).update(data).digest());
	if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
	try {
		const json = Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
		return JSON.parse(json);
	} catch {
		return null;
	}
}
