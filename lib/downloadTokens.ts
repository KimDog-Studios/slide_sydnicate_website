import crypto from "crypto";

export type TokenRecord = {
	token: string;
	href: string;
	id?: string;
	type?: string;
	title?: string;
	createdAt: number;
	expiresAt: number;
	usedAt?: number | null;
	graceUntil?: number | null;
	// Binding
	ipHash: string;        // HMAC(IP)
	uaHash: string;        // HMAC(User-Agent)
	clientNonce: string;   // from sessionStorage, mirrored in httpOnly cookie
};

const TOKENS = new Map<string, TokenRecord>();

// Keep process-stable secret for hashing (rotate in production)
const HMAC_SECRET = process.env.DOWNLOAD_TOKEN_HMAC_SECRET || crypto.createHash("sha256").update("dev-secret").digest("hex");

// Hash helpers (HMAC to avoid storing PII)
export const hmac = (s: string) => crypto.createHmac("sha256", HMAC_SECRET).update(s || "").digest("base64url");

// Allowed remote hosts to defend against SSRF
export const ALLOWED_HOSTS = new Set<string>([
	"kimdog-modding.b-cdn.net",
]);

export const isAllowedHref = (href: string) => {
	try {
		const u = new URL(href);
		return (u.protocol === "https:" || u.protocol === "http:") && ALLOWED_HOSTS.has(u.host);
	} catch {
		return false;
	}
};

export function newToken(): string {
	return crypto.randomBytes(16).toString("base64url");
}

export function saveToken(rec: TokenRecord) {
	TOKENS.set(rec.token, rec);
}

export function getToken(token: string): TokenRecord | undefined {
	return TOKENS.get(token);
}

export function consumeToken(token: string): TokenRecord | undefined {
	const rec = TOKENS.get(token);
	if (!rec) return undefined;
	const now = Date.now();
	// Mark used on first consume; no resume window
	if (!rec.usedAt) {
		rec.usedAt = now;
		rec.graceUntil = now;
	}
	TOKENS.set(token, rec);
	return rec;
}

export function revokeToken(token: string) {
	TOKENS.delete(token);
}

// Cleanup expired tokens periodically
let lastSweep = 0;
export function sweepExpired(now = Date.now()) {
	if (now - lastSweep < 30_000) return;
	lastSweep = now;
	for (const [tok, rec] of TOKENS.entries()) {
		if (now > rec.expiresAt && (!rec.graceUntil || now > rec.graceUntil)) {
			TOKENS.delete(tok);
		}
	}
}
