"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function StepMembership() {
	const router = useRouter();
	React.useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
				const j = r.ok ? await r.json() : null;
				if (alive && Array.isArray(j?.levels) && j.levels.length > 0) {
					try { localStorage.setItem("gs:membership", "1"); } catch {}
				}
			} catch {}
		})();
		return () => { alive = false; };
	}, []);
	return (
		<section style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 12 }}>
			<div style={{ gridColumn: "span 7" }}>
				<Panel>
					<h2 style={{ margin: 0 }}>Choose a Membership</h2>
					<p style={{ opacity: 0.9, marginTop: 8 }}>Unlock VIP perks and support the project.</p>
					<a href="/membership" style={btn("#ff3d6e", "#ff8c42")}>Explore Plans</a>
					<a href="/gift/redeem" style={btnOutline()}>Redeem Gift</a>
				</Panel>
			</div>
			<div style={{ gridColumn: "span 5" }}>
				<Panel>
					<h2 style={{ margin: 0 }}>Already Subscribed?</h2>
					<p style={{ opacity: 0.9, marginTop: 8 }}>Click to sync your Discord role with the site.</p>
					<a href="/profile?tab=subscriptions" style={btn("#3b82f6", "#06b6d4")}>Open Subscriptions</a>
				</Panel>
			</div>
			<div style={{ gridColumn: "1 / span 12", display: "flex", justifyContent: "space-between" }}>
				<button onClick={() => router.push("/get-started/discord")} style={btnGhost()}>← Back</button>
				<button
					onClick={() => {
						try { localStorage.setItem("gs:membership", "1"); } catch {}
						router.push("/get-started/servers");
					}}
					style={btnGhost()}
				>
					Next: Servers →
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
	padding: "10px 12px", borderRadius: 10, textAlign: "center", marginRight: 8,
	background: `linear-gradient(90deg, ${a}, ${b})`, border: "1px solid rgba(255,255,255,0.08)"
} as React.CSSProperties);
const btnOutline = () => ({
	display: "inline-block", textDecoration: "none", color: "#fff", fontWeight: 900,
	padding: "10px 12px", borderRadius: 10, textAlign: "center",
	border: "1px solid rgba(255,255,255,0.14)"
} as React.CSSProperties);
const btnGhost = () => ({
	padding: "10px 12px", borderRadius: 10, fontWeight: 900, color: "#fff",
	background: "transparent", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer"
} as React.CSSProperties);
