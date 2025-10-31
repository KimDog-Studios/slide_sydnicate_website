"use client";
import React, { useMemo, useState } from "react";
import { PARTNERS, PARTNER_TAGS, type Partner } from "./config";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import ContactUs from "@/Components/ContactUs";

// Local Discord SVG icon
const DiscordLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true" {...props}>
		<path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.398-.874-.62-1.249a.077.077 0 0 0-.079-.037c-1.43.33-3.004.83-4.885 1.515a.07.07 0 0 0-.032.026C.533 9.045-.32 13.58.099 18.061a.082.082 0 0 0 .031.057c2.052 1.5 4.042 2.403 5.992 3.03a.077.077 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.041-.107c-.652-.249-1.274-.549-1.872-.892a.077.077 0 0 1-.008-.128c.126-.095.252-.195.372-.296a.074.074 0 0 1 .077-.01c3.928 1.796 8.18 1.796 12.062 0a.074.074 0 0 1 .079.009c.12.101.246.201.372.296a.077.077 0 0 1-.006.128 12.297 12.297 0 0 1-1.874.892.077.077 0 0 0-.039.108c.36.699.772 1.364 1.225 1.994a.076.076 0 0 0 .084.028c1.953-.627 3.943-1.53 5.996-3.03a.082.082 0 0 0 .031-.057c.5-5.177-.838-9.673-3.549-13.666a.061.061 0 0 0-.031-.027zM8.02 15.727c-1.183 0-2.155-1.085-2.155-2.419 0-1.334.956-2.419 2.155-2.419 1.21 0 2.173 1.095 2.155 2.419 0 1.334-.956 2.419-2.155 2.419zm7.974 0c-1.183 0-2.155-1.085-2.155-2.419 0-1.334.956-2.419 2.155-2.419 1.21 0 2.173 1.095 2.155 2.419 0 1.334-.946 2.419-2.155 2.419z" />
	</svg>
);

type SortKey = "featured" | "name";
const PAGE_SIZE = 12;

export default function PartnersPage() {
	// filters
	const [search, setSearch] = useState("");
	const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
	const [sortBy, setSortBy] = useState<SortKey>("featured");
	const [page, setPage] = useState(1);

	// derived
	const allTags = useMemo(() => {
		const set = new Set<string>(PARTNER_TAGS as unknown as string[]);
		for (const p of PARTNERS) (p.tags ?? []).forEach((t) => set.add(t));
		return Array.from(set).sort();
	}, []);

	const searchLower = search.trim().toLowerCase();
	const filtered = useMemo(() => {
		return PARTNERS.filter((p) => {
			if (searchLower) {
				const hay = `${p.name} ${p.description} ${(p.tags ?? []).join(" ")}`.toLowerCase();
				if (!hay.includes(searchLower)) return false;
			}
			if (activeTags.size > 0) {
				const tags = new Set(p.tags ?? []);
				for (const t of activeTags) if (!tags.has(t)) return false;
			}
			return true;
		});
	}, [searchLower, activeTags]);

	const sorted = useMemo(() => {
		const arr = [...filtered];
		if (sortBy === "featured") {
			arr.sort((a, b) => {
				const f = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
				if (f !== 0) return f;
				return a.name.localeCompare(b.name);
			});
		} else {
			arr.sort((a, b) => a.name.localeCompare(b.name));
		}
		return arr;
	}, [filtered, sortBy]);

	// pagination
	const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
	const items = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

	// handlers
	const toggleTag = (t: string) => {
		const n = new Set(activeTags);
		if (n.has(t)) n.delete(t);
		else n.add(t);
		setActiveTags(n);
		setPage(1);
	};

	// styles
	const cardBorder = "1px solid rgba(139,40,255,0.22)";
	const cardBg = "linear-gradient(180deg, rgba(10,8,15,0.55), rgba(10,8,15,0.42))";

	return (
		<React.Fragment>
			<style>{`
				.p-toolbar {
					display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: center;
					background: rgba(10,8,15,0.4); border: 1px solid rgba(139,40,255,0.18);
					border-radius: 12px; padding: 12px; box-shadow: 0 8px 22px rgba(139,40,255,0.06) inset;
				}
				.p-tags { display: flex; gap: 8px; flex-wrap: wrap; }
				.p-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
				@media (max-width: 1200px) { .p-grid { grid-template-columns: repeat(2, 1fr); } }
				@media (max-width: 720px) { .p-grid { grid-template-columns: 1fr; } }
				.p-card {
					position: relative; display: flex; flex-direction: column; gap: 12px;
					padding: 14px; border-radius: 12px; background: ${cardBg}; border: ${cardBorder};
					box-shadow: 0 10px 26px rgba(139,40,255,0.08), 0 0 18px rgba(139,40,255,0.07) inset;
					transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
					overflow: hidden;
				}
				.p-card:hover { transform: translateY(-3px); box-shadow: 0 18px 46px rgba(139,40,255,0.16), 0 0 26px rgba(139,40,255,0.14) inset; border-color: rgba(139,40,255,0.36); }
				.p-banner {
					height: 140px; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center;
					background: rgba(12,10,16,0.7);
					border: 1px solid rgba(139,40,255,0.22);
				}
				.p-logo { max-width: 92%; max-height: 100%; filter: drop-shadow(0 2px 12px rgba(0,0,0,0.45)); }
				.p-title { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 18px; }
				.p-pill {
					font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 999px; letter-spacing: .4px;
					background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.28);
				}
				.p-desc { opacity: .95; line-height: 1.4; }
				.p-actions { display: flex; gap: 8px; flex-wrap: wrap; }
				.p-chiprow { display: flex; gap: 6px; flex-wrap: wrap; opacity: .95; }
			`}</style>

			<div style={{ padding: 30, paddingTop: 160, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18 }}>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ width: "100%", maxWidth: 1600, display: "flex", flexDirection: "column", gap: 16 }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "0 0 12px rgba(124,58,237,0.18)" }}>
								Partners
							</h2>
							<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700, opacity: 0.95, fontSize: 16 }}>
								Brands and teams we work with.
							</p>
						</div>

						{/* Toolbar */}
						<div className="p-toolbar">
							<TextField
								variant="outlined"
								placeholder="Search partners, tags, descriptions"
								size="small"
								value={search}
								onChange={(e) => { setSearch(e.target.value); setPage(1); }}
								InputProps={{ sx: { background: "rgba(139,40,255,0.06)", color: "#fff", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" } }}
							/>
							<Select
								size="small"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as SortKey)}
								sx={{ color: "#fff", background: "rgba(139,40,255,0.06)", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" }}
							>
								<MenuItem value="featured">Featured</MenuItem>
								<MenuItem value="name">Name</MenuItem>
							</Select>
							<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
								<Button variant="outlined" onClick={() => { setSearch(""); setActiveTags(new Set()); setSortBy("featured"); setPage(1); }} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.14)" }}>
									Reset
								</Button>
							</div>
						</div>

						{/* Tag filters */}
						<div className="p-tags">
							{allTags.map((t) => {
								const selected = activeTags.has(t);
								return (
									<Chip
										key={t}
										label={t}
										variant={selected ? "filled" : "outlined"}
										onClick={() => toggleTag(t)}
										onDelete={selected ? () => toggleTag(t) : undefined}
										color={selected ? "primary" : "default"}
										sx={{
											color: "#fff",
											borderColor: selected ? "transparent" : "rgba(139,40,255,0.28)",
											background: selected ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "rgba(139,40,255,0.06)",
										}}
									/>
								);
							})}
						</div>

						{/* Grid */}
						<div className="p-grid">
							{items.length === 0 ? (
								Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="p-card">
										<div className="p-banner">
											<Skeleton variant="rectangular" width="92%" height={120} />
										</div>
										<Skeleton variant="text" width="60%" height={28} />
										<Skeleton variant="text" width="92%" height={22} />
										<div className="p-actions">
											<Skeleton variant="rounded" width={120} height={34} />
											<Skeleton variant="rounded" width={100} height={34} />
										</div>
									</div>
								))
							) : (
								items.map((p) => <PartnerCard key={p.id} partner={p} />)
							)}
						</div>

						{/* Pagination */}
						{pageCount > 1 && (
							<div style={{ display: "flex", justifyContent: "center", paddingTop: 14 }}>
								<Pagination
									count={pageCount}
									page={page}
									onChange={(_, v) => setPage(v)}
									color="primary"
									siblingCount={1}
									boundaryCount={1}
									showFirstButton
									showLastButton
									sx={{ "& .MuiPaginationItem-root": { color: "#fff" }, "& .Mui-selected": { background: "#7c3aed" } }}
								/>
							</div>
						)}

						{/* Contact us — closer to content */}
						<div style={{ marginTop: 12 }}>
							<ContactUs />
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

function PartnerCard({ partner }: { partner: Partner }) {
	const grad = partner.gradient ?? "linear-gradient(90deg, rgba(139,40,255,0.25), rgba(6,182,212,0.25))";
	// Build socials from config (only those provided will render)
	const socials = [
		partner.social?.discord && {
			key: "discord",
			href: partner.social.discord,
			label: "Discord",
			color: "#5865F2",
			Icon: DiscordLogo,
			variant: "outlined" as const,
			style: { borderColor: "rgba(88,101,242,0.45)" },
		},
		partner.social?.twitter && {
			key: "twitter",
			href: partner.social.twitter,
			label: "Twitter",
			color: "#1DA1F2",
			Icon: TwitterIcon,
			variant: "outlined" as const,
			style: { borderColor: "rgba(29,161,242,0.45)" },
		},
		partner.social?.instagram && {
			key: "instagram",
			href: partner.social.instagram,
			label: "Instagram",
			color: "#E4405F",
			Icon: InstagramIcon,
			variant: "outlined" as const,
			style: { borderColor: "rgba(228,64,95,0.45)" },
		},
		partner.social?.youtube && {
			key: "youtube",
			href: partner.social.youtube,
			label: "YouTube",
			color: "#FF0000",
			Icon: YouTubeIcon,
			variant: "outlined" as const,
			style: { borderColor: "rgba(255,0,0,0.45)" },
		},
	].filter(Boolean) as Array<{
		key: string;
		href: string;
		label: string;
		color: string;
		Icon: React.ElementType;
		variant: "outlined" | "contained";
		style?: React.CSSProperties;
	}>;

	return (
		<div className="p-card">
			{/* Accent */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					background: `radial-gradient(600px 160px at 10% -20%, ${grad.replace("linear-gradient", "rgba").split(",")[1] ?? "rgba(124,58,237,0.18)"} 0%, transparent 60%)`,
					opacity: 0.35,
				}}
			/>
			<div className="p-banner" style={{ background: "rgba(18,16,24,0.7)" }}>
				<img src={partner.logo} alt={`${partner.name} logo`} className="p-logo" />
			</div>

			<div className="p-title">
				<span style={{ background: grad, WebkitBackgroundClip: "text", color: "transparent" }}>{partner.name}</span>
				{partner.featured ? <span className="p-pill">FEATURED</span> : null}
			</div>

			<div className="p-desc">{partner.description}</div>

			<div className="p-chiprow">
				{(partner.tags ?? []).map((t) => (
					<Chip key={t} label={t} size="small" sx={{ color: "#fff", borderColor: "rgba(139,40,255,0.28)", background: "rgba(139,40,255,0.08)" }} />
				))}
				{partner.promoCode ? (
					<Tooltip title="Promo code">
						<Chip label={`Code: ${partner.promoCode}`} size="small" sx={{ color: "#fff", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.28)" }} />
					</Tooltip>
				) : null}
			</div>

			<div className="p-actions">
				{partner.website && partner.website.trim().length > 0 ? (
					<Button
						variant="contained"
						href={partner.website}
						target="_blank"
						rel="noopener noreferrer"
						sx={{ background: "#7c3aed", "&:hover": { background: "#6d28d9" } }}
					>
						Visit site
					</Button>
				) : null}

				{socials.map((s) => (
					<Button
						key={s.key}
						variant={s.variant}
						href={s.href}
						target="_blank"
						rel="noopener noreferrer"
						startIcon={<s.Icon style={{ fontSize: 20 }} />}
						sx={{
							color: s.color,
							borderColor: s.style?.borderColor ?? "rgba(255,255,255,0.18)",
							"&:hover": { borderColor: s.color, background: "rgba(255,255,255,0.06)" },
						}}
					>
						{s.label}
					</Button>
				))}
			</div>
		</div>
	);
}
