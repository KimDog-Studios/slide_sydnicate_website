"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function StepServers() {
	const router = useRouter();
	return (
		<section style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 12 }}>
			<div style={{ gridColumn: "span 12" }}>
				<Panel>
					<h2 style={{ margin: 0 }}>Jump into the Action</h2>
					<p style={{ opacity: 0.9, marginTop: 8 }}>
						Browse all Slide Syndicate servers and connect. Your tier unlocks VIP slots and content.
					</p>
					<a href="/servers" style={btn("#3b82f6", "#06b6d4")}>View Servers</a>
					<a href="/profile?tab=subscriptions" style={btnOutline()}>Sync Roles</a>
				</Panel>
			</div>
			<div style={{ gridColumn: "1 / span 12", display: "flex", justifyContent: "flex-start" }}>
				<button onClick={() => router.push("/get-started/membership")} style={btnGhost()}>← Back</button>
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
