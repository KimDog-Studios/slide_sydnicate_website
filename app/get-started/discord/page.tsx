"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function StepDiscord() {
	const router = useRouter();
	const inviteUrl =
		(process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.com").trim();
	const clientId = (process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "").trim();
	const redirectUri = (process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "").trim();
	const scopes = (process.env.NEXT_PUBLIC_DISCORD_SCOPES ||
		"identify guilds guilds.channels.read role_connections.write gdm.join guilds.members.read openid").trim();

	const login = () => {
		if (!clientId || !redirectUri) return;
		const qs = new URLSearchParams({ client_id: clientId, response_type: "code", redirect_uri: redirectUri, scope: scopes });
		window.location.href = `https://discord.com/oauth2/authorize?${qs.toString()}`;
	};

	React.useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const s = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
				const sj = s.ok ? await s.json() : null;
				if (alive && sj?.authenticated) {
					try { localStorage.setItem("gs:discord", "1"); } catch {}
				}
			} catch {}
		})();
		return () => { alive = false; };
	}, []);

	return (
		<section style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 12 }}>
			<div style={{ gridColumn: "span 7" }}>
				<Panel>
					<h2 style={{ margin: 0 }}>Join our Discord</h2>
					<p style={{ opacity: 0.9, marginTop: 8 }}>Announcements, support and events happen here.</p>
					<a href={inviteUrl} target="_blank" rel="noreferrer" style={btn("#5865F2", "#8ea1f2")}>Open Discord</a>
				</Panel>
			</div>
			<div style={{ gridColumn: "span 5" }}>
				<Panel>
					<h2 style={{ margin: 0 }}>Sign in with Discord</h2>
					<p style={{ opacity: 0.9, marginTop: 8 }}>Link your account so we can sync roles and tiers.</p>
					<button onClick={login} style={btn("#6d28d9", "#a78bfa")}>Login with Discord</button>
					<p style={{ opacity: 0.8, marginTop: 10, fontSize: 12 }}>
						If you already logged in, continue to the next step.
					</p>
				</Panel>
			</div>
			<div style={{ gridColumn: "1 / span 12", display: "flex", justifyContent: "space-between" }}>
				<button onClick={() => router.push("/get-started/tools")} style={btnGhost()}>← Back</button>
				<button
					onClick={() => {
						try { localStorage.setItem("gs:discord", "1"); } catch {}
						router.push("/get-started/membership");
					}}
					style={btnGhost()}
				>
					Next: Membership →
				</button>
			</div>
		</section>
	);
}

function Panel({ children }: { children: React.ReactNode }) {
	return (
		<div style={{
			borderRadius: 14, padding: 16,
			background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.3))",
			border: "1px solid rgba(255,255,255,0.06)",
		}}>
			{children}
		</div>
	);
}
const btn = (a: string, b: string) => ({
	display: "inline-block", textDecoration: "none", color: "#fff", fontWeight: 900,
	padding: "10px 12px", borderRadius: 10, textAlign: "center",
	background: `linear-gradient(90deg, ${a}, ${b})`, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer"
} as React.CSSProperties);
const btnGhost = () => ({
	padding: "10px 12px", borderRadius: 10, fontWeight: 900, color: "#fff",
	background: "transparent", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer"
} as React.CSSProperties);
