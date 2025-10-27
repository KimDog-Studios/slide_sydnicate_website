import crypto from "crypto";

export const COOKIE_NAME = "ss_session";

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

function secret() {
	const s = process.env.SESSION_SECRET || "";
	if (!s) throw new Error("SESSION_SECRET missing");
	return s;
}

export function signSession(payload: any): string {
	const data = b64url(Buffer.from(JSON.stringify(payload)));
	const sig = b64url(crypto.createHmac("sha256", secret()).update(data).digest());
	return `${data}.${sig}`;
}

export function verifySession(token?: string | null): any | null {
	if (!token || typeof token !== "string" || !token.includes(".")) return null;
	const [data, sig] = token.split(".");
	const expected = b64url(crypto.createHmac("sha256", secret()).update(data).digest());
	if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
	try {
		const json = Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
		return JSON.parse(json);
	} catch {
		return null;
	}
}
