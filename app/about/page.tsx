"use client";
import React from "react";
import { ABOUT, TEAM, TIMELINE, type TeamMember } from "./config";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import ContactUs from "@/Components/ContactUs";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";

// Local Discord SVG icon
const DiscordLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true" {...props}>
		<path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.398-.874-.62-1.249a.077.077 0 0 0-.079-.037c-1.43.33-3.004.83-4.885 1.515a.07.07 0 0 0-.032.026C.533 9.045-.32 13.58.099 18.061a.082.082 0 0 0 .031.057c2.052 1.5 4.042 2.403 5.992 3.03a.077.077 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.041-.107c-.652-.249-1.274-.549-1.872-.892a.077.077 0 0 1-.008-.128c.126-.095.252-.195.372-.296a.074.074 0 0 1 .077-.01c3.928 1.796 8.18 1.796 12.062 0a.074.074 0 0 1 .079.009c.12.101.246.201.372.296a.077.077 0 0 1-.006.128 12.297 12.297 0 0 1-1.874.892.077.077 0 0 0-.039.108c.36.699.772 1.364 1.225 1.994a.076.076 0 0 0 .084.028c1.953-.627 3.943-1.53 5.996-3.03a.082.082 0 0 0 .031-.057c.5-5.177-.838-9.673-3.549-13.666a.061.061 0 0 0-.031-.027zM8.02 15.727c-1.183 0-2.155-1.085-2.155-2.419 0-1.334.956-2.419 2.155-2.419 1.21 0 2.173 1.095 2.155 2.419 0 1.334-.956 2.419-2.155 2.419zm7.974 0c-1.183 0-2.155-1.085-2.155-2.419 0-1.334.956-2.419 2.155-2.419 1.21 0 2.173 1.095 2.155 2.419 0 1.334-.946 2.419-2.155 2.419z" />
	</svg>
);

export default function AboutPage() {
	return (
		<React.Fragment>
			<style>{`
				.section {
					background: rgba(10,8,15,0.4);
					border: 1px solid rgba(139,40,255,0.18);
					border-radius: 12px;
					padding: 16px;
					box-shadow: 0 8px 22px rgba(139,40,255,0.06) inset;
				}
				.grid-2 {
					display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;
				}
				@media (max-width: 980px) { .grid-2 { grid-template-columns: 1fr; } }
				.stats {
					display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
				}
				@media (max-width: 980px) { .stats { grid-template-columns: repeat(2, 1fr); } }
				.stat {
					background: rgba(18,16,24,0.6);
					border: 1px solid rgba(139,40,255,0.22);
					border-radius: 12px;
					padding: 14px;
					text-align: center;
				}
				.stat .num {
					font-size: 26px; font-weight: 1000; letter-spacing: .5px;
					background: linear-gradient(90deg,#7c3aed,#06b6d4);
					-webkit-background-clip: text; color: transparent;
				}
				.team {
					display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
				}
				@media (max-width: 1200px) { .team { grid-template-columns: repeat(2, 1fr); } }
				@media (max-width: 720px) { .team { grid-template-columns: 1fr; } }
				.card {
					position: relative; display: flex; flex-direction: column; gap: 10px;
					padding: 14px; border-radius: 12px;
					background: linear-gradient(180deg, rgba(10,8,15,0.55), rgba(10,8,15,0.42));
					border: 1px solid rgba(139,40,255,0.22);
					box-shadow: 0 10px 26px rgba(139,40,255,0.08), 0 0 18px rgba(139,40,255,0.07) inset;
				}
				.avatar {
					width: 64px; height: 64px; border-radius: 12px;
					background: rgba(12,10,16,0.7); border: 1px solid rgba(139,40,255,0.22);
					overflow: hidden; display: flex; align-items: center; justify-content: center;
				}
				.timeline {
					display: grid; gap: 10px;
				}
				.tl-item {
					display: grid; grid-template-columns: 100px 1fr; gap: 12px; align-items: start;
					padding: 12px; border-radius: 12px; background: rgba(18,16,24,0.6); border: 1px solid rgba(139,40,255,0.22);
				}
				@media (max-width: 720px) { .tl-item { grid-template-columns: 1fr; } }
			`}</style>

			<div style={{ padding: 30, paddingTop: 160, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18 }}>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ width: "100%", maxWidth: 1600, display: "flex", flexDirection: "column", gap: 16 }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "0 0 12px rgba(124,58,237,0.18)" }}>About Us</h2>
							<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700, opacity: 0.95, fontSize: 16 }}>{ABOUT.tagline}</p>
						</div>

						{/* Mission + Values */}
						<div className="grid-2">
							<div className="section">
								<h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Our mission</h3>
								<p style={{ margin: 0, opacity: 0.95, lineHeight: 1.5 }}>{ABOUT.mission}</p>
							</div>
							<div className="section">
								<h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Values</h3>
								<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
									{ABOUT.values.map((v) => (
										<Chip key={v} label={v} sx={{ color: "#fff", background: "rgba(139,40,255,0.10)", border: "1px solid rgba(139,40,255,0.22)" }} />
									))}
								</div>
							</div>
						</div>

						{/* Stats */}
						<div className="stats">
							<div className="stat"><div className="num">{ABOUT.stats.playersMonthly}</div><div style={{ opacity: 0.85, fontWeight: 800 }}>Players / month</div></div>
							<div className="stat"><div className="num">{ABOUT.stats.servers}</div><div style={{ opacity: 0.85, fontWeight: 800 }}>Servers</div></div>
							<div className="stat"><div className="num">{ABOUT.stats.maps}</div><div style={{ opacity: 0.85, fontWeight: 800 }}>Maps</div></div>
							<div className="stat"><div className="num">{ABOUT.stats.regions}</div><div style={{ opacity: 0.85, fontWeight: 800 }}>Regions</div></div>
						</div>

						{/* Team */}
						<div>
							<h3 style={{ margin: "4px 0 8px 0", fontSize: 18, fontWeight: 900 }}>Team</h3>
							<div className="team">
								{TEAM.map((m) => <TeamCard key={m.id} member={m} />)}
							</div>
						</div>

						{/* Timeline */}
						<div>
							<h3 style={{ margin: "4px 0 8px 0", fontSize: 18, fontWeight: 900 }}>Timeline</h3>
							<div className="timeline">
								{TIMELINE.map((t, i) => (
									<div className="tl-item" key={`${t.date}-${i}`}>
										<div style={{ fontWeight: 1000, opacity: 0.95, letterSpacing: .3 }}>{t.date}</div>
										<div>
											<div style={{ fontWeight: 900, marginBottom: 4 }}>{t.title}</div>
											<div style={{ opacity: 0.95 }}>{t.description}</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Contact */}
						<div style={{ marginTop: 8 }}>
							<ContactUs />
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

function TeamCard({ member }: { member: TeamMember }) {
	const grad = member.gradient ?? "linear-gradient(90deg, rgba(139,40,255,0.25), rgba(6,182,212,0.25))";
	const socials = [
		member.social?.discord && { key: "discord", label: "Discord", href: member.social.discord, color: "#5865F2", Icon: DiscordLogo },
		member.social?.twitter && { key: "twitter", label: "Twitter", href: member.social.twitter, color: "#1DA1F2", Icon: TwitterIcon },
		member.social?.instagram && { key: "instagram", label: "Instagram", href: member.social.instagram, color: "#E4405F", Icon: InstagramIcon },
		member.social?.youtube && { key: "youtube", label: "YouTube", href: member.social.youtube, color: "#FF0000", Icon: YouTubeIcon },
	].filter(Boolean) as Array<{ key: string; label: string; href: string; color: string; Icon: React.ElementType }>;

	return (
		<div className="card">
			<div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(600px 160px at 10% -20%, ${grad.replace("linear-gradient", "rgba").split(",")[1] ?? "rgba(124,58,237,0.18)"} 0%, transparent 60%)`, opacity: 0.35 }} />
			<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
				<div className="avatar">
					<img src={member.avatar} alt={`${member.name} avatar`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
				</div>
				<div style={{ display: "flex", flexDirection: "column" }}>
					<div style={{ fontWeight: 1000, background: grad, WebkitBackgroundClip: "text", color: "transparent" }}>{member.name}</div>
					<div style={{ opacity: 0.9, fontWeight: 800 }}>{member.role}</div>
				</div>
			</div>
			<div style={{ opacity: 0.95 }}>{member.bio}</div>
			{(member.skills?.length ?? 0) > 0 && (
				<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
					{member.skills!.map((s) => (
						<Chip key={s} label={s} size="small" sx={{ color: "#fff", background: "rgba(139,40,255,0.10)", border: "1px solid rgba(139,40,255,0.22)" }} />
					))}
				</div>
			)}
			{socials.length > 0 && (
				<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
					{socials.map((s) => (
						<Button
							key={s.key}
							variant="outlined"
							href={s.href}
							target="_blank"
							rel="noopener noreferrer"
							startIcon={<s.Icon style={{ fontSize: 20 }} />}
							sx={{ color: s.color, borderColor: "rgba(255,255,255,0.18)", "&:hover": { borderColor: s.color, background: "rgba(255,255,255,0.06)" } }}
						>
							{s.label}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}
