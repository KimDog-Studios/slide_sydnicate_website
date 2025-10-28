import React from "react";

export default function Footer() {
	const year = new Date().getFullYear();
	const DISCORD = (process.env.NEXT_PUBLIC_DISCORD_INVITE || "").trim() || "#";

	return (
		<footer
			role="contentinfo"
			style={{
				marginTop: 32,
				background: "transparent",
				width: "100%",
				position: "relative",
				zIndex: 10000, // stay above fixed page overlays
				isolation: "isolate",
			}}
		>
			<div
				style={{
					maxWidth: 1280,
					margin: "0 auto",
					padding: 16,
					borderRadius: 12,
					border: "1px solid rgba(255,255,255,0.08)",
					background: "#000", // solid black to avoid transparency
					boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "minmax(160px,1fr) repeat(3, minmax(160px, 1fr))",
						gap: 16,
						alignItems: "start",
					}}
				>
					<div style={{ padding: "6px 8px" }}>
						<a href="/" aria-label="Slide Syndicate" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
							<span
								style={{
									fontWeight: 900,
									letterSpacing: 0.6,
									background: "linear-gradient(90deg,#c4b5fd,#7c3aed)",
									WebkitBackgroundClip: "text",
									color: "transparent",
									textShadow: "0 0 10px rgba(124,58,237,0.45)",
                                }}
							>
								Slide Syndicate
							</span>
						</a>
					</div>

					<div>
						<FooterHeading>About Us</FooterHeading>
						<FooterLink href="/#about">About Us</FooterLink>
						<FooterLink href="/#contact">Contacts</FooterLink>
					</div>

					<div>
						<FooterHeading>Get started</FooterHeading>
						<FooterLink href="/membership">Subscription</FooterLink>
						<FooterLink href="/servers">Servers</FooterLink>
						<FooterLink href="/leaderboard">Leaderboard</FooterLink>
					</div>

					<div>
						<FooterHeading>Legal</FooterHeading>
						<FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
						<FooterLink href="/legal/terms">Terms Of Use</FooterLink>
						<FooterLink href="/legal/refund">Refund Policy</FooterLink>
						<FooterLink href="/legal/cookies">Cookie Policy</FooterLink>
						<div style={{ display: "flex", gap: 10, marginTop: 10 }}>
							<a href={DISCORD} target="_blank" rel="noopener noreferrer" aria-label="Discord" style={iconWrapStyle}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M20.3 4.4A19 19 0 0 0 15.9 3l-.5 1.1a17 17 0 0 1-6.8 0L8.1 3A18.9 18.9 0 0 0 3.7 4.4C1.6 8 1 11.6 1.2 15.2a19 19 0 0 0 6.1 3l1-2s-.9-.3-1.9-.8c1.5.3 3 .5 4.6.5s3.1-.2 4.6-.5c-1 .4-1.9.8-1.9.8l1 2a19 19 0 0 0 6.1-3c.3-3.6-.4-7.2-2.5-10.8ZM9.5 14.1c-1 0-1.9-1-1.9-2.2 0-1.1.8-2.1 1.9-2.1s2 .9 2 2.1c0 1.2-.9 2.2-2 2.2Zm5 0c-1 0-2-1-2-2.2 0-1.1.8-2.1 2-2.1 1 0 1.9.9 1.9 2.1 0 1.2-.8 2.2-2 2.2Z" />
								</svg>
							</a>
						</div>
					</div>
				</div>

				<div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 12, paddingTop: 10 }}>
					<small style={{ color: "rgba(255,255,255,0.85)" }}>
						Slide Syndicate © {year}. All rights reserved. Not affiliated with Assetto Corsa, Kunos Simulazioni, or any related entities.
					</small>
				</div>
			</div>
		</footer>
	);
}

function FooterHeading({ children }: { children: React.ReactNode }) {
	return <div style={{ color: "#fff", fontWeight: 900, marginBottom: 8, fontSize: 13 }}>{children}</div>;
}
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a
			href={href}
			style={{ display: "block", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, padding: "4px 0" }}
		>
			{children}
		</a>
	);
}
const iconWrapStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: 32,
	height: 32,
	borderRadius: 8,
	border: "1px solid rgba(255,255,255,0.12)",
	color: "#e5e7eb",
	background: "#0b0b0b",
	textDecoration: "none",
};
