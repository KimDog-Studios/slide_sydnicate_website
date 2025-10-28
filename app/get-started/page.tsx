"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function GetStartedPage() {
	const router = useRouter();
	return (
		<main style={{ minHeight: "100vh", color: "#fff", background: "#0b0b0b" }}>
			<section style={{ padding: "96px 16px 40px", maxWidth: 1100, margin: "0 auto" }}>
				<header style={{ textAlign: "center", marginBottom: 18 }}>
					<h1 style={{
						margin: 0, fontSize: "2.0rem", lineHeight: 1.06, fontWeight: 900,
						textShadow: "0 0 10px #7c3aed, 0 0 24px rgba(124,58,237,0.7), 0 2px 0 rgba(0,0,0,0.6)"
					}}>
						Step 1 — Install Assetto Corsa
					</h1>
					<p style={{ margin: "10px auto 0", opacity: 0.95 }}>
						Purchase and install Assetto Corsa before continuing.
					</p>
				</header>

				<div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 12 }}>
					<div style={col(5)}>
						<Panel>
							<h2 style={h2()}>Buy Assetto Corsa (Ultimate)</h2>
							<p style={p()}>For the best experience we recommend the Ultimate Edition.</p>
							<div style={{ display: "grid", gap: 8 }}>
								<a href="https://store.steampowered.com/app/244210/Assetto_Corsa/" target="_blank" rel="noreferrer" style={btn("#6d28d9", "#a78bfa")}>
									Buy on Steam
								</a>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
									<a href="https://www.instant-gaming.com/en/search/?q=assetto%20corsa" target="_blank" rel="noreferrer" style={btn("#0ea5e9", "#22d3ee")}>
										Instant Gaming
									</a>
									<a href="https://www.g2a.com/search?query=assetto%20corsa" target="_blank" rel="noreferrer" style={btn("#f97316", "#fb923c")}>
										G2A
									</a>
								</div>
							</div>
						</Panel>
					</div>
					<div style={col(7)}>
						<Panel>
							<h2 style={h2()}>PC Minimum Requirements</h2>
							<ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8, opacity: 0.95 }}>
								<li>Windows 10/11 64-bit</li>
								<li>Intel Core i7 XXXX / AMD Ryzen 2XXXX or better</li>
								<li>16GB RAM (32GB recommended for mod packs)</li>
								<li>NVIDIA GTX 1060 / AMD RX 580 or better</li>
								<li>100GB SSD free space (mods + packs)</li>
							</ul>
						</Panel>
					</div>

					<div style={{ gridColumn: "1 / span 12", display: "flex", justifyContent: "flex-end" }}>
						<button
							onClick={() => {
								try { localStorage.setItem("gs:install", "1"); } catch {}
								router.push("/get-started/tools");
							}}
							style={btnGhost()}
						>
							Next: Install Tools →
						</button>
					</div>
				</div>
			</section>
		</main>
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

const col = (n: number) => ({ gridColumn: `span ${n}` });
const h2 = () => ({ margin: "0 0 8px", fontWeight: 900 } as React.CSSProperties);
const p = () => ({ margin: "8px 0 12px", opacity: 0.9 } as React.CSSProperties);
const btn = (a: string, b: string) => ({
	display: "inline-block", textDecoration: "none", color: "#fff", fontWeight: 900,
	padding: "10px 12px", borderRadius: 10, textAlign: "center",
	background: `linear-gradient(90deg, ${a}, ${b})`, border: "1px solid rgba(255,255,255,0.08)"
} as React.CSSProperties);
const btnGhost = () => ({
	padding: "10px 12px", borderRadius: 10, fontWeight: 900, color: "#fff",
	background: "transparent", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer"
} as React.CSSProperties);
