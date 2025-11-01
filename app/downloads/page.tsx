"use client";

import React from "react";
import {
	Box,
	Stack,
	Typography,
	TextField,
	InputAdornment,
	Chip,
	Button,
	Select,
	MenuItem,
	FormControl,
	Card,
	CardContent,
	CardActions,
	Divider,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
	Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Pagination from "@mui/material/Pagination";
import { downloadsConfig, DownloadType, DownloadItem } from "./config";

// Visual helpers (keep consistent with site)
const glass = {
	background: "linear-gradient(180deg, rgba(14,10,20,0.70), rgba(14,10,20,0.46))",
	border: "1px solid rgba(167,139,250,0.22)",
	boxShadow: "0 10px 30px rgba(124,58,237,0.22), inset 0 0 0 1px rgba(255,255,255,0.02)",
	backdropFilter: "blur(10px)",
} as const;

// Neon styling helpers (purple outline + glow)
const NEON_PURPLE = "#c4b5fd";
const NEON_BORDER = "1px solid rgba(196,181,253,0.45)";
const NEON_GLOW = "0 10px 26px rgba(124,58,237,0.30), 0 0 18px rgba(124,58,237,0.45)";
const LOCK_GLOW = "0 12px 24px rgba(255,61,110,0.35)";
const yourTierLabel = (n: number) => `Your Tier: ${n}`;

// Type color mapping
const typeColor: Record<DownloadType, string> = {
	car: "#3b82f6",
	map: "#a855f7",
	tool: "#22c55e",
	pack: "#f59e0b",
	livery: "#ef4444",
};

// Stable date formatter (module-level; no hooks)
const DATE_FMT = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" });
const formatIsoDate = (_iso?: string) => ""; // no-op (we're hiding updated date)

// Fixed sizes for all cards (uniform across breakpoints)
const CARD_HEIGHT = 480;
const IMAGE_HEIGHT = 150;
// Fallback thumbnail (used if an item has no image)
const DEFAULT_THUMB =
	"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop stop-color='%230b0b0b' stop-opacity='1'/%3E%3Cstop stop-color='%2312121a' stop-opacity='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='675'/%3E%3C/svg%3E";

// Smooth scroll to top
const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
	if (typeof window !== "undefined") {
		window.scrollTo({ top: 0, behavior });
	}
};

function useDownloadsFilter(items: DownloadItem[]) {
	const [q, setQ] = React.useState("");
	const [types, setTypes] = React.useState<DownloadType[]>([]);
	const [tags, setTags] = React.useState<string[]>([]);
	const [sort, setSort] = React.useState<"recent" | "az" | "size_desc" | "size_asc">("recent");

	const allTags = React.useMemo(() => {
		const s = new Set<string>();
		items.forEach((i) => i.tags.forEach((t) => s.add(t)));
		return Array.from(s).sort((a, b) => a.localeCompare(b));
	}, [items]);

	const filtered = React.useMemo(() => {
		let list = items.slice();

		// text search
		const qn = q.trim().toLowerCase();
		if (qn) {
			list = list.filter((i) =>
				[i.title, i.description, i.version, ...i.tags].filter(Boolean).some((v) => String(v).toLowerCase().includes(qn))
			);
		}
		// type filter
		if (types.length) list = list.filter((i) => types.includes(i.type));
		// tags filter (all selected tags must be present)
		if (tags.length) list = list.filter((i) => tags.every((t) => i.tags.includes(t)));

		// sort
		list.sort((a, b) => {
			if (sort === "az") return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
			if (sort === "size_desc") return (b.sizeMB || 0) - (a.sizeMB || 0) || a.title.localeCompare(b.title);
			if (sort === "size_asc") return (a.sizeMB || 0) - (b.sizeMB || 0) || a.title.localeCompare(b.title);
			// recent: updatedAt desc with stable tiebreakers
			const da = Date.parse(a.updatedAt || "1970-01-01T00:00:00Z");
			const db = Date.parse(b.updatedAt || "1970-01-01T00:00:00Z");
			if (db !== da) return db - da;
			return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
		});

		return list;
	}, [items, q, types, tags, sort]);

	const reset = () => {
		setQ("");
		setTypes([]);
		setTags([]);
		setSort("recent");
	};

	return { q, setQ, types, setTypes, tags, setTags, sort, setSort, filtered, allTags, reset };
}

// Tier helpers
const clampTier = (n: number | undefined, def: number) =>
	typeof n === "number" && n >= 0 && n <= 3 ? n : def;
const withinTier = (userMax: number, minT?: number, maxT?: number) => {
	const min = clampTier(minT, 0);
	const max = clampTier(maxT, 3);
	return userMax >= min && userMax <= max;
};
const tierRangeLabel = (minT?: number, maxT?: number) => {
	const min = clampTier(minT, 0);
	const max = clampTier(maxT, 3);
	return min === max ? `Tier ${min}` : `Tier ${min}–${max}`;
};
// Map common tier names to numeric levels
const tierNameToLevel = (name?: string | null): number | null => {
	const k = String(name || "").toLowerCase();
	if (!k) return null;
	if (k.includes("pro")) return 3;
	if (k.includes("tandem")) return 2;
	if (k.includes("street")) return 1;
	if (k.includes("beginner") || k.includes("public")) return 0;
	return null;
};

export default function DownloadsPage() {
	const { items } = downloadsConfig;
	const f = useDownloadsFilter(items);

	// User's highest tier (robust: try multiple sources, then clamp)
	const [userMaxLevel, setUserMaxLevel] = React.useState<number>(0);
	React.useEffect(() => {
		let alive = true;
		(async () => {
			let best = 0;

			// 1) Primary: subscription status
			try {
				const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
				if (r.ok) {
					const j = await r.json().catch(() => null);
					const levels: number[] = Array.isArray(j?.levels)
						? j.levels.map((n: any) => Number(n)).filter((n: number) => !Number.isNaN(n))
						: [];
					if (levels.length) best = Math.max(best, Math.max(...levels));
					const tName = j?.tier;
					const tLvl = tierNameToLevel(tName);
					if (tLvl !== null) best = Math.max(best, tLvl);
				}
			} catch {}

			// 2) Fallback: discord snapshot (often has freshest roles/levels)
			try {
				const r = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
				if (r.ok) {
					const j = await r.json().catch(() => null);
					const levels: number[] = Array.isArray(j?.levels)
						? j.levels.map((n: any) => Number(n)).filter((n: number) => !Number.isNaN(n))
						: [];
					if (levels.length) best = Math.max(best, Math.max(...levels));
					const tName = j?.tier;
					const tLvl = tierNameToLevel(tName);
					if (tLvl !== null) best = Math.max(best, tLvl);
				}
			} catch {}

			// 3) Session fallback + admin override
			try {
				const r = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
				if (r.ok) {
					const s = await r.json().catch(() => null);
					const tName = s?.user?.tier;
					const tLvl = tierNameToLevel(tName);
					if (tLvl !== null) best = Math.max(best, tLvl);
					// Admin override (public env)
					const adminId = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID || "").trim();
					const uid = s?.user?.id ? String(s.user.id) : "";
					if (adminId && uid && uid === adminId) {
						best = Math.max(best, 3);
					}
				}
			} catch {}

			if (alive) setUserMaxLevel(Math.max(0, Math.min(3, best)));
		})();
		return () => { alive = false; };
	}, []);

	// Pagination (9 per page)
	const pageSize = 9;
	const [page, setPage] = React.useState(1);
	React.useEffect(() => {
		setPage(1);
		scrollToTop();
	}, [f.q, f.types, f.tags, f.sort]);
	const total = f.filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const start = (page - 1) * pageSize;
	const pageItems = f.filtered.slice(start, start + pageSize);

	const toggleType = (t: DownloadType) => {
		f.setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
	};
	const toggleTag = (t: string) => {
		f.setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
	};

	// One-time link modal state
	const [dlOpen, setDlOpen] = React.useState(false);
	const [dlItem, setDlItem] = React.useState<DownloadItem | null>(null);
	const [dlUrl, setDlUrl] = React.useState<string>("");
	const [dlBusy, setDlBusy] = React.useState(false);
	const [dlErr, setDlErr] = React.useState<string>("");
	const [dlCountdown, setDlCountdown] = React.useState<number>(5);

	// Per-session client nonce to help the server bind tokens to this session/device
	const clientNonceRef = React.useRef<string>("");
	React.useEffect(() => {
		try {
			let n = sessionStorage.getItem("dl:nonce") || "";
			if (!n) {
				// 16 random bytes hex
				const arr = new Uint8Array(16);
				if (typeof crypto !== "undefined" && crypto.getRandomValues) {
					crypto.getRandomValues(arr);
					n = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
				} else {
					n = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
				}
				sessionStorage.setItem("dl:nonce", n);
			}
			clientNonceRef.current = n;
		} catch {}
	}, []);

	const issueOneTimeLink = React.useCallback(async (item: DownloadItem) => {
		setDlBusy(true);
		setDlErr("");
		setDlUrl("");
		try {
			// Collect lightweight client hints for binding on the server
			const bind = {
				clientNonce: clientNonceRef.current || "",
				userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
				lang: typeof navigator !== "undefined" ? navigator.language : "",
				tz: (() => {
					try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; }
				})(),
				viewport: { w: typeof window !== "undefined" ? window.innerWidth : 0, h: typeof window !== "undefined" ? window.innerHeight : 0 },
			};

			const res = await fetch("/api/downloads/issue-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					href: item.href,
					id: item.id,
					type: item.type,
					title: item.title,
					// Hard requirements for the server (enforcement server-side)
					requirements: {
						oneTime: true,           // consume once; invalidate immediately after
						maxAgeSeconds: 20,       // very short TTL
						bindToUser: true,        // bind to authenticated user/session
						bindToIP: true,          // bind to request IP on server
						bindToUA: true,          // bind to user-agent
					},
					bind,
				}),
			});
			const j = res.ok ? await res.json().catch(() => null) : null;
			const url: string | undefined = j?.url || j?.signedUrl || j?.oneTimeUrl;
			if (!res.ok || !url) throw new Error(j?.error || "Failed to issue one-time link");
			setDlUrl(url);
			setDlCountdown(5);
		} catch (e: any) {
			setDlErr(String(e?.message || "Failed to issue one-time link"));
		} finally {
			setDlBusy(false);
		}
	}, []);

	const openDownload = (item: DownloadItem) => {
		setDlItem(item);
		setDlOpen(true);
		setDlErr("");
		setDlUrl("");
		setDlCountdown(5);
		issueOneTimeLink(item);
	};
	const closeDownload = () => {
		setDlOpen(false);
		setDlItem(null);
		setDlUrl("");
		setDlErr("");
	};

	// Auto-redirect countdown once we have a link
	React.useEffect(() => {
		if (!dlOpen || !dlUrl) return;
		let timer: any = null;
		timer = setInterval(() => {
			setDlCountdown((c) => {
				if (c <= 1) {
					clearInterval(timer);
					window.location.href = dlUrl;
					return 0;
				}
				return c - 1;
			});
		}, 1000);
		return () => {
			if (timer) clearInterval(timer);
		};
	}, [dlOpen, dlUrl]);

	// Scroll to top when page changes
	React.useEffect(() => {
		scrollToTop();
	}, [page]);

	// totals
	const modTotal = items.length;
	const carsTotal = items.filter(i => i.type === "car").length;
	const packsTotal = items.filter(i => i.type === "pack").length;

	return (
		<Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 16 }, color: "#e5e7eb" }}>
			<Stack spacing={2} sx={{ mb: 2 }}>
				<Typography variant="h4" sx={{ fontWeight: 900 }}>Downloads</Typography>
				<Typography variant="body2" sx={{ opacity: 0.85 }}>
					Browse community cars, maps, tools, packs and liveries. Use search and filters to find what you need.
				</Typography>
			</Stack>

			{/* Controls */}
			<Box
				sx={{
					...glass,
					borderRadius: 2,
					p: 2,
					mb: 3,
					border: NEON_BORDER,
					boxShadow: `${NEON_GLOW}, inset 0 0 0 1px rgba(255,255,255,0.02)`,
					position: "sticky",
					// Increased offset so it doesn't tuck under your TopBar
					top: { xs: 76, md: 100 },
					zIndex: 2,
				}}
			>
				<Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
					<TextField
						value={f.q}
						onChange={(e) => f.setQ(e.target.value)}
						size="small"
						fullWidth
						placeholder="Search downloads…"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: "#c4b5fd" }} />
								</InputAdornment>
							),
						}}
						sx={{
							minWidth: { md: 360 },
							"& .MuiOutlinedInput-root": { color: "#fff" },
							"& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.16)" },
						}}
					/>

					<FormControl size="small" sx={{ minWidth: 160 }}>
						<Select
							value={f.sort}
							onChange={(e) => f.setSort(e.target.value as any)}
							displayEmpty
							sx={{
								color: "#fff",
								"& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.16)" },
							}}
						>
							<MenuItem value="recent">Sort: Most recent</MenuItem>
							<MenuItem value="az">Sort: A–Z</MenuItem>
							<MenuItem value="size_desc">Sort: Size (largest)</MenuItem>
							<MenuItem value="size_asc">Sort: Size (smallest)</MenuItem>
						</Select>
					</FormControl>

					<Box sx={{ flex: 1 }} />

					<Button onClick={f.reset} variant="outlined" size="small" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.22)" }}>
						Reset
					</Button>
				</Stack>

				{/* Totals under Reset */}
				<Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
					<Chip label={`${modTotal} Mods`} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.22)" }} />
					<Chip label={`${carsTotal} Cars`} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.22)" }} />
					<Chip label={`${packsTotal} Car Packs`} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.22)" }} />
				</Stack>

				{/* Type filters */}
				<Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
					{(["car", "map", "tool", "pack", "livery"] as DownloadType[]).map((t) => {
						const active = f.types.includes(t);
						return (
							<Chip
								key={t}
								label={t.toUpperCase()}
								variant={active ? "filled" : "outlined"}
								onClick={() => toggleType(t)}
								sx={{
									color: active ? "#0b0b0b" : "#fff",
									bgcolor: active ? NEON_PURPLE : "transparent",
									borderColor: active ? NEON_PURPLE : "rgba(255,255,255,0.22)",
									fontWeight: 800,
									boxShadow: active ? NEON_GLOW : "none",
									"&:hover": { opacity: 0.95 },
								}}
							/>
						);
					})}
				</Stack>

				{/* Tag filters */}
				{f.allTags.length > 0 && (
					<>
						<Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />
						<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
							{f.allTags.map((t) => {
								const active = f.tags.includes(t);
								return (
									<Chip
										key={t}
										label={`#${t}`}
										size="small"
										variant={active ? "filled" : "outlined"}
										onClick={() => toggleTag(t)}
										sx={{
											color: active ? "#0b0b0b" : "#fff",
											bgcolor: active ? NEON_PURPLE : "transparent",
											borderColor: active ? NEON_PURPLE : "rgba(255,255,255,0.22)",
											fontWeight: 800,
											boxShadow: active ? NEON_GLOW : "none",
 											"&:hover": { opacity: 0.9 },
										}}
									/>
								);
							})}
						</Stack>
					</>
				)}
			</Box>

			{/* Results */}
			{f.filtered.length === 0 ? (
				<Box sx={{ textAlign: "center", opacity: 0.85, py: 6 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>No results</Typography>
					<Typography variant="body2">Try changing filters or clearing the search.</Typography>
				</Box>
			) : (
				<Box
					sx={{
						display: "grid",
						gap: 2,
						alignItems: "stretch",
						justifyItems: "stretch",
						width: "100%",
						gridTemplateColumns: {
							xs: "repeat(1, minmax(0, 1fr))",
							sm: "repeat(2, minmax(0, 1fr))",
							md: "repeat(3, minmax(0, 1fr))",
						},
					}}
				>
					{pageItems.map((d) => {
						const allowed = withinTier(userMaxLevel, d.minTier, d.maxTier);
						const reqLabel = tierRangeLabel(d.minTier, d.maxTier);
						const img = (d.image || "").trim() || DEFAULT_THUMB;

						return (
							<Box key={d.id} sx={{ display: "flex", width: "100%", minWidth: 0 }}>
								<Card
									sx={{
										overflow: "hidden",
										borderRadius: 2,
										border: allowed ? NEON_BORDER : "1px solid rgba(255,99,132,0.45)",
										bgcolor: "#0b0b0b",
										color: "#fff",
										boxShadow: allowed ? NEON_GLOW : LOCK_GLOW,
										position: "relative",
										// Remove translate hover to avoid perceived size differences
										transition: "box-shadow 160ms ease",
										"&:hover": { boxShadow: allowed ? "0 14px 36px rgba(124,58,237,0.35)" : LOCK_GLOW },
										width: "100%",
										height: CARD_HEIGHT,
										display: "flex",
										flexDirection: "column",
										boxSizing: "border-box",
									}}
									elevation={4}
								>
									{/* Image header */}
									<Box
										sx={{
											height: IMAGE_HEIGHT,
											backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${img})`,
											backgroundSize: "cover",
											backgroundPosition: "50% 50%",
											backgroundRepeat: "no-repeat",
											flexShrink: 0,
										}}
									/>
									<CardContent sx={{ p: 2, flexGrow: 1, overflow: "hidden", minWidth: 0 }}>
										<Stack
											direction="row"
											spacing={1}
											alignItems="center"
											sx={{
												mb: 1,
												flexWrap: "nowrap",
												overflow: "hidden",
												minHeight: 28,
												minWidth: 0,
											}}
										>
											<Chip
												label={d.type.toUpperCase()}
												size="small"
												sx={{
													color: "#0b0b0b",
													bgcolor: typeColor[d.type],
													fontWeight: 900,
													whiteSpace: "nowrap",
												}}
											/>
											{d.version && (
												<Chip
													label={`v${d.version}`}
													size="small"
													variant="outlined"
													sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.22)", whiteSpace: "nowrap" }}
												/>
											)}
											<Chip
												label={reqLabel}
												size="small"
												variant="outlined"
												sx={{
													color: "#fff",
													borderColor: NEON_PURPLE,
													boxShadow: NEON_GLOW,
													ml: 0.5,
													fontWeight: 900,
													whiteSpace: "nowrap",
												}}
											/>
											<Chip
												label={yourTierLabel(userMaxLevel)}
												size="small"
												variant="outlined"
												sx={{
													color: "#fff",
													borderColor: "rgba(255,255,255,0.22)",
													ml: 0.5,
													whiteSpace: "nowrap",
												}}
											/>
										</Stack>

										<Typography
											variant="h6"
											sx={{
												fontWeight: 900,
												mb: 0.5,
												display: "-webkit-box",
												WebkitLineClamp: 1,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
												textOverflow: "ellipsis",
												wordBreak: "break-word",
												minWidth: 0,
											}}
										>
											{d.title}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												opacity: 0.9,
												mb: 1.25,
												display: "-webkit-box",
												WebkitLineClamp: 3,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
												wordBreak: "break-word",
												minWidth: 0,
											}}
										>
											{d.description}
										</Typography>

										<Stack
											direction="row"
											spacing={1}
											sx={{ flexWrap: "wrap", rowGap: 0.75, maxHeight: 52, overflow: "hidden", minWidth: 0 }}
										>
											{d.tags.map((t) => (
												<Chip
													key={t}
													label={`#${t}`}
													size="small"
													variant="outlined"
													sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.18)", whiteSpace: "nowrap" }}
												/>
											))}
										</Stack>
									</CardContent>
									<Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
									<CardActions
										sx={{
											p: 1.5,
											display: "flex",
											alignItems: "center",
											minHeight: 56,
											flexShrink: 0,
											overflow: "hidden",
											minWidth: 0,
										}}
									>
										{typeof d.sizeMB === "number" && (
											<Typography variant="caption" sx={{ opacity: 0.9, whiteSpace: "nowrap" }}>
												Size: {d.sizeMB.toFixed(0)} MB
											</Typography>
										)}
										<Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
											<Tooltip title={allowed ? "Generate one-time link" : `Locked — ${reqLabel} • ${yourTierLabel(userMaxLevel)}`}>
												<span>
													<Button
														onClick={() => allowed && openDownload(d)}
														variant="contained"
														disableElevation
														size="small"
														startIcon={allowed ? <DownloadOutlinedIcon /> : <LockOutlinedIcon />}
														disabled={!allowed}
														sx={{
															bgcolor: "#fff",
															color: "#0b0b0b",
															fontWeight: 900,
															boxShadow: allowed ? NEON_GLOW : "none",
															"&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.6)", color: "#0b0b0b" },
															whiteSpace: "nowrap",
														}}
													>
														{allowed ? "Get Link" : "Locked"}
													</Button>
												</span>
											</Tooltip>
										</Box>
									</CardActions>
								</Card>
							</Box>
						);
					})}
				</Box>
			)}

			{/* One-time link confirmation modal */}
			<Dialog open={dlOpen} onClose={dlBusy ? undefined : closeDownload} fullWidth maxWidth="sm">
				<DialogTitle sx={{ fontWeight: 900 }}>
					{dlItem ? `Download — ${dlItem.title}` : "Download"}
				</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2}>
						<Typography variant="body2">
							We will generate a secure one-time link bound to your account and device. It will only work once,
							will expire immediately after use, and cannot be shared.
						</Typography>
						{dlBusy && (
							<Stack direction="row" spacing={1} alignItems="center">
								<CircularProgress size={18} />
								<Typography variant="body2">Generating secure one-time link…</Typography>
							</Stack>
						)}
						{dlErr && <Alert severity="error">{dlErr}</Alert>}
						{!dlBusy && !dlErr && dlUrl && (
							<Typography variant="body2">
								Redirecting in {dlCountdown}s…
							</Typography>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDownload} disabled={dlBusy}>Cancel</Button>
					<Button
						variant="contained"
						disableElevation
						onClick={() => dlUrl && (window.location.href = dlUrl)}
						disabled={!dlUrl || !!dlErr || dlBusy}
						sx={{ fontWeight: 800, bgcolor: "#ffffff", color: "#0b0b0b" }}
					>
						{dlBusy ? "Please wait…" : dlErr ? "Retry above" : "Download now"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Pagination */}
			{totalPages > 1 && (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
					<Pagination
						count={totalPages}
						page={page}
						onChange={(_, p) => setPage(p)}
						variant="outlined"
						shape="rounded"
						sx={{
							"& .MuiPaginationItem-root": { color: "#fff", borderColor: "rgba(255,255,255,0.22)" },
							"& .MuiPaginationItem-root.Mui-selected": {
								bgcolor: NEON_PURPLE,
								color: "#0b0b0b",
								boxShadow: NEON_GLOW,
							},
						}}
					/>
				</Box>
			)}
		</Box>
	);
}
