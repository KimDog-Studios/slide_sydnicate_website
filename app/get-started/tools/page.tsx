"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function StepTools() {
	const router = useRouter();
	return (
		<section style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 12 }}>
			<div style={{ gridColumn: "span 12" }}>
				<Panel>
					<h2 style={{ margin: 0 }}>Install Essentials</h2>
					<p style={{ opacity: 0.9, marginTop: 8 }}>
						Content Manager streamlines launching and online play. Add the shader/pp filters pack to improve visuals.
					</p>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
						<Card title="Content Manager" href="https://acstuff.ru/app/" c1="#6d28d9" c2="#a78bfa">
							Lightweight launcher with server browser, mod manager, and tweaks.
						</Card>
						<Card title="Custom Shaders Patch" href="https://acstuff.ru/patch/" c1="#16a34a" c2="#22c55e">
							Graphics & physics improvements used by most mod servers.
						</Card>
						<Card title="Recommended Filters" href="https://www.racedepartment.com/" c1="#3b82f6" c2="#06b6d4">
							Grab a PP filter (A3PP, Natural Mod, etc.) for better visuals at night/day.
						</Card>
					</div>
				</Panel>
			</div>
			<div style={{ gridColumn: "1 / span 12", display: "flex", justifyContent: "space-between" }}>
				<button onClick={() => router.push("/get-started")} style={btnGhost()}>← Back</button>
				<button
					onClick={() => {
						try { localStorage.setItem("gs:tools", "1"); } catch {}
						router.push("/get-started/discord");
					}}
					style={btnGhost()}
				>
					Next: Discord →
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
function Card({ title, href, c1, c2, children }: { title: string; href: string; c1: string; c2: string; children: React.ReactNode }) {
	return (
		<a href={href} target="_blank" rel="noreferrer" style={{
			textDecoration: "none", color: "#fff", borderRadius: 14, padding: 14,
			background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.3))",
			border: "1px solid rgba(255,255,255,0.06)"
		}}>
			<strong style={{ display: "inline-block", marginBottom: 6, padding: "4px 8px", borderRadius: 8,
				background: `linear-gradient(90deg, ${c1}, ${c2})`, border: "1px solid rgba(255,255,255,0.08)" }}>
				{title}
			</strong>
			<p style={{ margin: 0, opacity: 0.9 }}>{children}</p>
		</a>
	);
}
const btnGhost = () => ({
	padding: "10px 12px", borderRadius: 10, fontWeight: 900, color: "#fff",
	background: "transparent", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer"
} as React.CSSProperties);
