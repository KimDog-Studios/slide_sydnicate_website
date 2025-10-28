import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { COOKIE_NAME, verifySession } from "../../auth/_lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const WEBHOOK_URL = process.env.DISCORD_BOT_WEBHOOK_URL || "";
const WEBHOOK_SECRET = process.env.DISCORD_BOT_WEBHOOK_SECRET || "";
const VERIFIED_ROLE_ID = (process.env.DISCORD_VERIFIED_ROLE_ID || "").trim();

// Map membership levels to role IDs (configure via env)
const ROLE_MAP: Record<number, string | undefined> = {
	0: process.env.DISCORD_ROLE_TIER0_ID,
	1: process.env.DISCORD_ROLE_TIER1_ID,
	2: process.env.DISCORD_ROLE_TIER2_ID,
	3: process.env.DISCORD_ROLE_TIER3_ID,
};
const ALL_ROLE_IDS = Object.values(ROLE_MAP).filter(Boolean) as string[];

const TIER_NAME_BY_LEVEL: Record<number, string> = {
	0: "Beginner Access",
	1: "Streetline",
	2: "Tandem Club",
	3: "Pro Line",
};

// Helper: fetch member and normalize fields we need
async function fetchMember(userId: string): Promise<{ joinedAt: string | null; roles: string[]; isMember: boolean } | null> {
	if (!BOT_TOKEN || !GUILD_ID) return null;
	const r = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
		headers: { Authorization: `Bot ${BOT_TOKEN}` },
		cache: "no-store",
	});
	if (!r.ok) return null;
	const j = await r.json();
	const roles = Array.isArray(j?.roles) ? j.roles.map((x: any) => String(x)) : [];
	const joinedAt: string | null = typeof j?.joined_at === "string" ? j.joined_at : null;
	return { joinedAt, roles, isMember: true };
}

// Helper: derive levels (tiers) from role IDs
function levelsFromRoles(roles: string[]): number[] {
	const out: number[] = [];
	for (const [lvlStr, rid] of Object.entries(ROLE_MAP)) {
		if (rid && roles.includes(rid)) out.push(Number(lvlStr));
	}
	return out;
}
function highestLevel(levels: number[]): number | null {
	if (!levels.length) return null;
	return Math.max(...levels);
}
function tierNameFromLevels(levels: number[]): string | null {
	const h = highestLevel(levels);
	return h == null ? null : (TIER_NAME_BY_LEVEL[h] || `Tier ${h}`);
}
function normalizeResponse(member: { joinedAt: string | null; roles: string[]; isMember: boolean } | null) {
	const roles = member?.roles ?? [];
	const levels = levelsFromRoles(roles);
	const top = highestLevel(levels);
	const tier = tierNameFromLevels(levels);
	const isVerified = VERIFIED_ROLE_ID ? roles.includes(VERIFIED_ROLE_ID) : false;
	return {
		isMember: member?.isMember ?? false,
		joinedAt: member?.joinedAt ?? null,
		joined_at: member?.joinedAt ?? null, // compat
		roles,
		roleIds: roles,      // compat
		role_ids: roles,     // compat
		levels,
		highestLevel: top,
		tier: tier ?? null,
		isVerified,
	};
}

export async function POST(req: Request) {
	const jar = cookies();
	const token = (await jar).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	if (!sess?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json().catch(() => null) as { level?: number } | null;
	const level = typeof body?.level === "number" ? body!.level : NaN;
	if (!(level >= 0 && level <= 3)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

	const targetRole = ROLE_MAP[level];
	if (!targetRole) return NextResponse.json({ error: "Tier role not configured" }, { status: 400 });
	if (!GUILD_ID) return NextResponse.json({ error: "DISCORD_GUILD_ID not set" }, { status: 500 });

	// Mode A: Direct Discord REST
	if (BOT_TOKEN) {
		const ensureMember = async () => {
			const r = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${sess.id}`, {
				headers: { Authorization: `Bot ${BOT_TOKEN}` },
				cache: "no-store",
			});
			if (r.status === 200) return true;
			// Try to add member using user's OAuth access token if present
			if (sess.accessToken) {
				const join = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${sess.id}`, {
					method: "PUT",
					headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
					body: JSON.stringify({ access_token: sess.accessToken }),
				});
				return join.status === 201 || join.status === 204 || join.status === 200;
			}
			return false;
		};

		try {
			const inGuild = await ensureMember();
			if (!inGuild) {
				return NextResponse.json(
					{ error: "Join the Discord server first.", ...normalizeResponse(null) },
					{ status: 400 }
				);
			}

			// Add role
			const addRole = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${sess.id}/roles/${targetRole}`, {
				method: "PUT",
				headers: { Authorization: `Bot ${BOT_TOKEN}` },
			});
			if (addRole.status !== 204) {
				const text = await addRole.text().catch(() => "");
				return NextResponse.json({ error: `Failed to add role (${addRole.status}) ${text}` }, { status: 500 });
			}

			// Remove other tier roles
			for (const rid of ALL_ROLE_IDS) {
				if (rid && rid !== targetRole) {
					await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${sess.id}/roles/${rid}`, {
						method: "DELETE",
						headers: { Authorization: `Bot ${BOT_TOKEN}` },
					}).catch(() => {});
				}
			}

			// Fetch fresh member state to report joinedAt/roles/levels
			const member = await fetchMember(String(sess.id));
			return NextResponse.json({ ok: true, ...normalizeResponse(member) });
		} catch {
			return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
		}
	}

	// Mode B: Self-hosted bot webhook
	if (WEBHOOK_URL && WEBHOOK_SECRET) {
		const payload = {
			action: "grantRole",
			guildId: GUILD_ID,
			userId: String(sess.id),
			targetRoleId: targetRole,
			removeOtherRoleIds: ALL_ROLE_IDS.filter((r) => r !== targetRole),
		};
		const json = JSON.stringify(payload);
		const sig = crypto.createHmac("sha256", WEBHOOK_SECRET).update(json).digest("hex");

		const res = await fetch(WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-ss-signature": sig },
			body: json,
		}).catch(() => null);

		if (!res) return NextResponse.json({ error: "Webhook not reachable" }, { status: 502 });
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			return NextResponse.json({ error: `Webhook error (${res.status}) ${text}` }, { status: 502 });
		}

		// If a bot token is available, return live membership details; otherwise return ok only
		if (BOT_TOKEN) {
			const member = await fetchMember(String(sess.id));
			return NextResponse.json({ ok: true, ...normalizeResponse(member) });
		}
		return NextResponse.json({ ok: true });
	}

	return NextResponse.json({ error: "Server not configured (set bot token or webhook)" }, { status: 500 });
}

// GET: return current membership snapshot (joinedAt, roles, levels, tier, etc.)
export async function GET() {
	const jar = cookies();
	const token = (await jar).get(COOKIE_NAME)?.value || null;
	const sess = verifySession(token);
	if (!sess?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (!BOT_TOKEN || !GUILD_ID) {
		return NextResponse.json({ error: "Server not configured", ...normalizeResponse(null) }, { status: 500 });
	}
	try {
		const member = await fetchMember(String(sess.id));
		return NextResponse.json({ ok: true, ...normalizeResponse(member) });
	} catch {
		return NextResponse.json({ error: "Unexpected error", ...normalizeResponse(null) }, { status: 500 });
	}
}
