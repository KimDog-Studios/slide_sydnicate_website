"use client";
import React from "react";
import {
	Box,
	Paper,
	Stack,
	Avatar,
	Typography,
	Chip,
	Divider,
	Button,
	Card,
	CardContent,
	Skeleton,
	Dialog,
	DialogTitle,
	DialogContent,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SubscriptionsOutlinedIcon from "@mui/icons-material/SubscriptionsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { keyframes } from "@mui/system";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import TwitterIcon from "@mui/icons-material/Twitter";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import RedditIcon from "@mui/icons-material/Reddit";
import { useRouter, useSearchParams } from "next/navigation";

type SessionUser = {
	id: string;
	displayName: string;
	avatar?: string | null;
	tier?: string | null;
};
const tierMetaByName = (t?: string | null) => {
	const k = (t ?? "").toLowerCase().trim();
	if (k === "streetline" || k === "tier 1") return { label: "Streetline", gradient: "linear-gradient(90deg,#3b82f6,#06b6d4)" };
	if (k === "tandem club" || k === "tier 2") return { label: "Tandem Club", gradient: "linear-gradient(90deg,#a855f7,#f59e0b)" };
	if (k === "pro line" || k === "tier 3" || k === "pro") return { label: "Pro Line", gradient: "linear-gradient(90deg,#ff3d6e,#ff8c42)" };
	return { label: "Beginner Access", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
};
const tierNameByLevel: Record<number, string> = { 0: "Beginner Access", 1: "Streetline", 2: "Tandem Club", 3: "Pro Line" };
const tierGradientByLevel: Record<number, string> = {
	0: "linear-gradient(90deg,#374151,#6b7280)",
	1: "linear-gradient(90deg,#3b82f6,#06b6d4)",
	2: "linear-gradient(90deg,#a855f7,#f59e0b)",
	3: "linear-gradient(90deg,#ff3d6e,#ff8c42)",
};

// Small helpers for banner
const bannerUrl = (process.env.NEXT_PUBLIC_PROFILE_BANNER_URL || "").trim();
// Optional Bunny.net CDN base (e.g. https://yourzone.b-cdn.net). If set, relative avatar paths are rewritten to CDN URLs.
const cdnBase = (process.env.NEXT_PUBLIC_CDN_BASE || "").replace(/\/+$/, "");
const resolveCdnUrl = (v?: string | null): string | undefined => {
	if (!v) return undefined;
	if (/^https?:\/\//i.test(v)) return v;
	if (!cdnBase) return v.startsWith("/") ? v : `/${v}`;
	return `${cdnBase}${v.startsWith("/") ? v : `/${v}`}`;
};

// Stats placeholder (replace with real data later)
const defaultStats = {
	topSpeedKmh: null as number | null,
	distanceKm: null as number | null,
	longestKm: null as number | null,
	points: null as number | null,
};

// FontAwesome mapping for requested syntax usage
const byPrefixAndName = {
	fab: { steam: faSteam, discord: faDiscord },
	fas: {} as Record<string, any>, // solid icons not installed; fallback helpers below
};

// Animations for the verified tick
const tickPulse = keyframes`
  0% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(59,130,246,0.55)); }
  50% { transform: scale(1.12); filter: drop-shadow(0 0 14px rgba(59,130,246,0.9)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(59,130,246,0.55)); }
`;
const ringPulse = keyframes`
  0%   { transform: scale(0.9); opacity: .55; }
  70%  { transform: scale(1.25); opacity: 0; }
  100% { transform: scale(0.9); opacity: 0; }
`;

// Fallback helpers: use FA solid if present, else MUI icons
const CalendarIcon = () =>
	byPrefixAndName.fas?.["calendar-days"] ? (
		<FontAwesomeIcon icon={byPrefixAndName.fas["calendar-days"]} style={{ color: "#cbd5e1", width: 14, height: 14 }} />
	) : (
		<CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "#cbd5e1" }} />
	);
const ShieldIcon = () =>
	byPrefixAndName.fas?.["shield-check"] ? (
		<FontAwesomeIcon icon={byPrefixAndName.fas["shield-check"]} style={{ color: "#22c55e", width: 14, height: 14 }} />
	) : (
		<ShieldOutlinedIcon sx={{ fontSize: 16, color: "#22c55e" }} />
	);

// Helper: derive tier name from owned levels (fallback when session.tier is missing)
const deriveTierNameFromLevels = (levels: number[] | null | undefined): string | null => {
	if (!Array.isArray(levels) || levels.length === 0) return null;
	const max = Math.max(...levels.filter((n) => typeof n === "number" && !Number.isNaN(n)));
	if (max >= 3) return "Pro Line";
	if (max === 2) return "Tandem Club";
	if (max === 1) return "Streetline";
	return "Beginner Access";
};

export default function ProfilePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [loading, setLoading] = React.useState(true);
	const [user, setUser] = React.useState<SessionUser | null>(null);
	const [isAdmin, setIsAdmin] = React.useState(false);
	const [levels, setLevels] = React.useState<number[]>([]);
	const [stats] = React.useState(defaultStats);
	type TabKey = "home" | "friends" | "edit" | "subscriptions" | "transactions";
	const normalizeTab = (raw?: string | null): TabKey => {
		const t = String(raw || "").toLowerCase();
		return (["home", "friends", "edit", "subscriptions", "transactions"] as const).includes(t as TabKey) ? (t as TabKey) : "home";
	};
	// Hydration-safe: start with "home", then sync from URL after mount
	const [tab, setTab] = React.useState<TabKey>("home");
	const [guildJoinedAt, setGuildJoinedAt] = React.useState<string | null>(null);
	const [flagEmoji, setFlagEmoji] = React.useState<string>("");
	const [sinceStr, setSinceStr] = React.useState<string>("");
	const [isVerified, setIsVerified] = React.useState(false);
	const [steam, setSteam] = React.useState<{ id: string; name?: string | null; avatar?: string | null; source?: string } | null>(null);
	const [steamLoading, setSteamLoading] = React.useState(true);
	const [shareOpen, setShareOpen] = React.useState(false);
	const [copied, setCopied] = React.useState(false);
	const [viewName, setViewName] = React.useState<string | null>(null);
	const [publicProfile, setPublicProfile] = React.useState<{
		displayName?: string;
		avatar?: string | null;
		isVerified?: boolean;
		steam?: { id: string; name?: string | null };
	} | null>(null);
	const [publicLoading, setPublicLoading] = React.useState(false);
	const [refreshingMembership, setRefreshingMembership] = React.useState(false);
	// Freeze role IDs so hooks don't depend on them (avoids changing deps size)
	const verifiedRoleIdRef = React.useRef<string>(
		(process.env.NEXT_PUBLIC_DISCORD_VERIFIED_ROLE_ID || "1217484465975070720").trim()
	);
	const adminRoleIdRef = React.useRef<string>(
		(process.env.NEXT_PUBLIC_DISCORD_ADMIN_ROLE_ID || process.env.DISCORD_ADMIN_ROLE_ID || "").trim()
	);
	const discordInvite = (process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.com").trim();

	// Normalize and apply a membership snapshot (from /api/discord/grant-role GET)
	const applyMembershipSnapshot = React.useCallback((snap: any) => {
		if (!snap) return;
		// joinedAt/joined_at
		const ja: unknown = snap.joinedAt ?? snap.joined_at;
		if (typeof ja === "string" && ja) setGuildJoinedAt(ja);
		// roles aliases
		const rolesRaw: unknown = snap.roles ?? snap.roleIds ?? snap.role_ids;
		if (Array.isArray(rolesRaw)) {
			const roles = rolesRaw.map((x: any) => String(x));
			setIsVerified(roles.includes(verifiedRoleIdRef.current) || !!snap.isVerified);
			// derive admin from roles
			if (adminRoleIdRef.current && roles.includes(adminRoleIdRef.current)) setIsAdmin(true);
		}
		// levels + tier backfill (prefer snapshot tier/derived)
		if (Array.isArray(snap.levels)) {
			const lvls = snap.levels.map((n: any) => Number(n)).filter((n: any) => !Number.isNaN(n));
			if (lvls.length) setLevels(lvls);
			const derived = deriveTierNameFromLevels(lvls);
			setUser((prev) => (prev ? { ...prev, tier: snap.tier || derived || prev.tier || null } : prev));
		} else if (typeof snap.tier === "string" && snap.tier) {
			setUser((prev) => (prev ? { ...prev, tier: snap.tier } : prev));
		}
		// No deps: uses stable refs + setters
	}, []);

	// Restore API-based bootstrap (session, admin, subscription)
	React.useEffect(() => {
		let alive = true;
		(async () => {
			try {
				// session
				const s = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
				const sj = s.ok ? await s.json() : null;
				if (alive && sj?.authenticated && sj?.user) {
					setUser({
						id: String(sj.user.id),
						displayName: String(sj.user.displayName),
						avatar: sj.user.avatar ?? null,
						tier: sj.user.tier ?? null,
					});
				}
			} catch {}
			try {
				// admin role
				const a = await fetch("/api/auth/is-admin", { credentials: "include", cache: "no-store" });
				const aj = a.ok ? await a.json() : null;
				if (alive) setIsAdmin(!!aj?.isAdmin);
			} catch {}
			try {
				// owned subscription levels (+ joinedAt if provided by API)
				const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
				const rj = r.ok ? await r.json() : null;
				if (alive && rj) {
					if (Array.isArray(rj?.levels)) {
						const lvls = rj.levels.map((n: any) => Number(n)).filter((n: any) => !Number.isNaN(n));
						setLevels(lvls);
						// Prefer derived over any stale session tier
						const derived = deriveTierNameFromLevels(lvls);
						if (derived) {
							setUser((prev) => (prev ? { ...prev, tier: derived } : prev));
						}
					}
					const ja: unknown = (rj as any)?.joinedAt ?? (rj as any)?.joined_at;
					if (typeof ja === "string" && ja) setGuildJoinedAt(ja);
					// Detect roles (verified/admin) from any roles array shape
					const rolesRaw: unknown = (rj as any)?.roles ?? (rj as any)?.roleIds ?? (rj as any)?.role_ids;
					if (Array.isArray(rolesRaw)) {
						const roles = rolesRaw.map((x: any) => String(x));
						setIsVerified(roles.includes(verifiedRoleIdRef.current));
						if (adminRoleIdRef.current && roles.includes(adminRoleIdRef.current)) setIsAdmin(true);
					}
				}
			} catch {}
			try {
				// Membership snapshot from Discord (joinedAt, roles, levels, tier)
				const m = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
				const mj = m.ok ? await m.json() : null;
				if (alive && mj) applyMembershipSnapshot(mj);
			} catch {}
			if (alive) setLoading(false);
		})();
		return () => { alive = false; };
	}, [applyMembershipSnapshot]);

	// Restore API-based Steam fetch
	React.useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const r = await fetch("/api/steam/me", { credentials: "include", cache: "no-store" });
				const j = r.ok ? await r.json() : null;
				if (alive && j?.id) setSteam({ id: String(j.id), name: j.name ?? null, avatar: j.avatar ?? null, source: j.source });
			} catch {}
			if (alive) setSteamLoading(false);
		})();
		return () => { alive = false; };
	}, []);

	// Client-only: compute flag emoji once after mount to avoid SSR mismatch
	React.useEffect(() => {
		try {
			const lang = (navigator?.language || "en-GB").split("-")[1] || "GB";
			const cc = lang.toUpperCase();
			const emoji = cc.replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
			setFlagEmoji(emoji);
		} catch {
			setFlagEmoji("");
		}
	}, []);

	// Client-only: format joinedAt once available to avoid SSR mismatch
	React.useEffect(() => {
		try {
			if (!guildJoinedAt) {
				setSinceStr("");
				return;
			}
			const d = new Date(guildJoinedAt);
			setSinceStr(d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }));
		} catch {
			setSinceStr("");
		}
	}, [guildJoinedAt]);

	// Parse profile target from query (?username=, ?u=, or bare ?{username})
	React.useEffect(() => {
		try {
			const qs = typeof window !== "undefined" ? window.location.search : "";
			if (!qs) return;
			const sp = new URLSearchParams(qs);
			let name = sp.get("username") || sp.get("u") || null;
			if (!name) {
				for (const [k, v] of sp.entries()) {
					if (k && !v) { name = k; break; } // handles bare ?{username}
				}
			}
			if (name) setViewName(decodeURIComponent(String(name)).replace(/^@/, ""));
		} catch {}
	}, []);

	// Slugify helper for stable share links
	const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "_");
	const isOwnProfile = user?.displayName ? (!viewName || slugify(viewName) === slugify(user.displayName)) : !viewName;

	// Public profile: API only
	React.useEffect(() => {
		let alive = true;
		(async () => {
			if (!viewName || isOwnProfile) return;
			setPublicLoading(true);
			try {
				const r = await fetch(`/api/profile/public?username=${encodeURIComponent(viewName)}`, { cache: "no-store" });
				const j = r.ok ? await r.json() : null;
				if (alive && j) {
					setPublicProfile({
						displayName: j.displayName || j.name || viewName,
						avatar: j.avatar ?? null,
						isVerified: !!j.isVerified,
						steam: j?.steam?.id ? { id: String(j.steam.id), name: j.steam.name ?? null } : undefined,
					});
				}
			} catch {
				if (alive) setPublicProfile(null);
			}
			if (alive) setPublicLoading(false);
		})();
		return () => { alive = false; };
	}, [viewName, isOwnProfile]);

	// Computed view model: prefer public profile data when not own
	const shownName =
		isOwnProfile
			? (user?.displayName || (loading ? "Loading..." : "Guest"))
			: (publicProfile?.displayName || viewName || "Profile");
	const avatarSrc = resolveCdnUrl(isOwnProfile ? user?.avatar : publicProfile?.avatar);
	const verifiedShow = isOwnProfile ? isVerified : !!publicProfile?.isVerified;
	const steamForView = isOwnProfile ? steam : (publicProfile?.steam ?? null);
	// Use the best available tier: session tier or derive from levels
	const effectiveTier = user?.tier ?? deriveTierNameFromLevels(levels);
	const tierMeta = tierMetaByName(effectiveTier);

	const _copyId = async () => {
		if (!user?.id) return;
		try {
			await navigator.clipboard.writeText(user.id);
			// Optional: toast could be added; keep minimal
		} catch {}
	};
	const shareProfile = async () => {
		// Native share from inside the modal
		try {
			const url = typeof window !== "undefined" ? window.location.href : "";
			const title = user?.displayName ? `${user.displayName}'s profile` : "Profile";
			if (navigator.share) await navigator.share({ title, url });
		} catch {}
	};
	const openShare = () => setShareOpen(true);
	const closeShare = () => { setShareOpen(false); setCopied(false); };
	const getShareUrl = () => {
		const origin = typeof window !== "undefined" ? window.location.origin : "";
		const name = shownName && shownName !== "Guest" ? slugify(shownName) : "";
		return `${origin}/profile${name ? `?${encodeURIComponent(name)}` : ""}`;
	};
	const getShareTitle = () => (`${shownName}'s profile`);
	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(getShareUrl());
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch {}
	};
	const shareTo = (platform: "twitter" | "facebook" | "reddit" | "whatsapp" | "telegram" | "email") => {
		const url = encodeURIComponent(getShareUrl());
		const text = encodeURIComponent(getShareTitle());
		let href = "";
		switch (platform) {
			case "twitter": href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
			case "facebook": href = `https://www.facebook.com/sharer.php?u=${url}`; break;
			case "reddit": href = `https://www.reddit.com/submit?url=${url}&title=${text}`; break;
			case "whatsapp": href = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
			case "telegram": href = `https://t.me/share/url?url=${url}&text=${text}`; break;
			case "email": href = `mailto:?subject=${text}&body=${text}%0A${url}`; break;
		}
		if (href) window.open(href, "_blank", "noopener,noreferrer");
	};

	const linkSteam = () => { window.location.href = "/api/steam/auth/start"; };
	// Optional refresh kept internal; no UI when linked
	const _refreshSteamInternal = async () => {
		setSteamLoading(true);
		try {
			const r = await fetch("/api/steam/me", { credentials: "include", cache: "no-store" });
			const j = r.ok ? await r.json() : null;
			setSteam(j?.id ? { id: String(j.id), name: j.name ?? null, avatar: j.avatar ?? null, source: j.source } : null);
		} catch {}
		setSteamLoading(false);
	};

	const refreshMembership = async () => {
		try {
			setRefreshingMembership(true);
			const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
			const j = r.ok ? await r.json() : null;
			if (!j) return;
			if (Array.isArray(j.levels)) {
				const lvls = j.levels.map((n: any) => Number(n)).filter((n: any) => !Number.isNaN(n));
				setLevels(lvls);
				const derived = deriveTierNameFromLevels(lvls);
				// Always prefer the derived tier from current roles/levels
				if (derived) setUser((prev) => (prev ? { ...prev, tier: derived } : prev));
			}
			if (Array.isArray(j.roles)) {
				const roles = j.roles.map((x: any) => String(x));
				setIsVerified(roles.includes(verifiedRoleIdRef.current));
				if (adminRoleIdRef.current && roles.includes(adminRoleIdRef.current)) setIsAdmin(true);
			}
			const ja: unknown = j.joinedAt ?? j.joined_at;
			if (typeof ja === "string" && ja) setGuildJoinedAt(ja);
			// Also refresh directly from Discord to ensure latest join/roles/levels
			try {
				const m = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
				const mj = m.ok ? await m.json() : null;
				if (mj) applyMembershipSnapshot(mj);
			} catch {}
		} finally {
			setRefreshingMembership(false);
		}
	};

	// Keep tab in sync only when the actual ?tab= value changes
	const tabParam = searchParams?.get("tab") || null;
	React.useEffect(() => {
		if (!tabParam) return; // don't override local state if URL has no tab
		const next = normalizeTab(tabParam);
		if (next !== tab) setTab(next);
	}, [tabParam, tab]);

	// Helper to update tab and URL (preserve username/u when viewing others)
	const updateTab = (next: TabKey) => {
		const restricted = next === "edit" || next === "subscriptions" || next === "transactions";
		// Allow admins to access restricted tabs even on others' profiles
		const finalTab: TabKey = (!isOwnProfile && !isAdmin && restricted) ? "home" : next;
		setTab(finalTab);
		try {
			// Build a clean query; keep username for public profiles
			const params = new URLSearchParams();
			if (finalTab === "home") {
				params.set("tab", "home");
				if (!isOwnProfile && viewName) params.set("username", viewName);
				router.replace(`/profile?${params.toString()}`);
				return;
			}
			params.set("tab", finalTab);
			if (!isOwnProfile && viewName) params.set("username", viewName);
			router.replace(`/profile?${params.toString()}`);
		} catch {}
	};

	return (
		<Box sx={{ minHeight: "100vh", px: 0, py: 0 }}>
			<Paper
				variant="outlined"
				sx={{
					position: "relative",
					minHeight: "100vh",
					width: "100%",
					p: 0,
					borderRadius: 0,
					borderColor: "rgba(167,139,250,0.28)",
					backgroundColor: "#0b0b0b",
					backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7))",
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					color: "#fff",
					backdropFilter: "blur(8px)",
					boxShadow: "0 18px 48px rgba(0,0,0,0.6)",
					"&::before": {
						content: '""',
						position: "absolute",
						inset: -1,
						borderRadius: 0,
						padding: "1px",
						background: "linear-gradient(90deg,#7c3aed,#b388ff,#a78bfa)",
						WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
						WebkitMaskComposite: "xor",
						maskComposite: "exclude",
						opacity: 0.35,
						pointerEvents: "none",
					},
				}}
			>
				<Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pt: { xs: 12, sm: 14 }, pb: 6 }}>
					{/* Top nav row (tabs) */}
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
						<Button
							startIcon={<HomeOutlinedIcon />}
							size="small"
							onClick={() => updateTab("home")}
							variant={tab === "home" ? "contained" : "outlined"}
							disableElevation
							sx={{
								bgcolor: tab === "home" ? "#18181b" : "transparent",
								color: "#fff",
								borderRadius: 2,
								textTransform: "none",
								px: 1.5,
								borderColor: "rgba(255,255,255,0.12)",
							}}
						>
							Home
						</Button>
						<Button
							startIcon={<GroupOutlinedIcon />}
							size="small"
							onClick={() => updateTab("friends")}
							variant={tab === "friends" ? "contained" : "outlined"}
							sx={{ borderColor: "rgba(255,255,255,0.12)", color: "#fff", textTransform: "none", borderRadius: 2, bgcolor: tab === "friends" ? "#18181b" : "transparent" }}
						>
							Friends
						</Button>
						<Button
							startIcon={<EditOutlinedIcon />}
							size="small"
							onClick={() => updateTab("edit")}
							disabled={!isOwnProfile && !isAdmin}
							variant={tab === "edit" ? "contained" : "outlined"}
							sx={{ opacity: (!isOwnProfile && !isAdmin) ? 0.5 : 1, pointerEvents: (!isOwnProfile && !isAdmin) ? "none" : "auto", borderColor: "rgba(255,255,255,0.12)", color: "#fff", textTransform: "none", borderRadius: 2, bgcolor: tab === "edit" ? "#18181b" : "transparent" }}
						>
							Edit Profile
						</Button>
						<Button
							startIcon={<SubscriptionsOutlinedIcon />}
							size="small"
							onClick={() => updateTab("subscriptions")}
							disabled={!isOwnProfile && !isAdmin}
							variant={tab === "subscriptions" ? "contained" : "outlined"}
							sx={{ opacity: (!isOwnProfile && !isAdmin) ? 0.5 : 1, pointerEvents: (!isOwnProfile && !isAdmin) ? "none" : "auto", borderColor: "rgba(255,255,255,0.12)", color: "#fff", textTransform: "none", borderRadius: 2, bgcolor: tab === "subscriptions" ? "#18181b" : "transparent" }}
						>
							Subscriptions
						</Button>
						<Button
							startIcon={<ReceiptLongOutlinedIcon />}
							size="small"
							onClick={() => updateTab("transactions")}
							disabled={!isOwnProfile && !isAdmin}
							variant={tab === "transactions" ? "contained" : "outlined"}
							sx={{ opacity: (!isOwnProfile && !isAdmin) ? 0.5 : 1, pointerEvents: (!isOwnProfile && !isAdmin) ? "none" : "auto", borderColor: "rgba(255,255,255,0.12)", color: "#fff", textTransform: "none", borderRadius: 2, bgcolor: tab === "transactions" ? "#18181b" : "transparent" }}
						>
							Transactions
						</Button>
						<Box sx={{ flexGrow: 1 }} />
						<Button
							href={discordInvite}
							target="_blank"
							rel="noreferrer"
							size="small"
							variant="outlined"
							startIcon={<FontAwesomeIcon icon={byPrefixAndName.fab["discord"]} style={{ color: "#5865F2" }} />}
							sx={{ borderColor: "rgba(255,255,255,0.12)", color: "#fff", textTransform: "none", borderRadius: 2 }}
						>
							Discord
						</Button>
					</Stack>

					{tab === "home" && (
						<>
							{/* Hero banner */}
							<Box
								sx={{
									position: "relative",
									height: { xs: 180, sm: 220 },
									borderRadius: 2,
									overflow: "hidden",
									border: "1px solid rgba(255,255,255,0.06)",
									background: bannerUrl
										? `linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35)), url("${bannerUrl}") center/cover no-repeat`
										: "linear-gradient(90deg, rgba(20,20,20,0.9), rgba(60,20,80,0.6))",
								}}
							>
								{/* Right: country + since + share */}
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: "absolute", right: 12, top: 12 }}>
									{isOwnProfile && (
										<Typography variant="caption" sx={{ color: "#fff", opacity: 0.9, display: "flex", alignItems: "center", gap: 0.5 }}>
											{flagEmoji ? `${flagEmoji} ` : ""}Participated from <CalendarIcon />{sinceStr || "—"}
										</Typography>
									)}
									<Button size="small" startIcon={<ShareOutlinedIcon />} onClick={openShare} sx={{ color: "#fff", textTransform: "none", px: 1, minWidth: 0 }}>
										Share profile
									</Button>
								</Stack>

								{/* Left: avatar  name/badges */}
								<Stack direction="row" spacing={2} alignItems="center" sx={{ position: "absolute", left: { xs: 12, sm: 16 }, bottom: { xs: 12, sm: 16 } }}>
									{/* Single neon avatar */}
									<Box
										sx={{
											position: "relative",
											"&::after": {
												content: '""',
												position: "absolute",
												inset: -6,
												borderRadius: "9999px",
												background:
													"radial-gradient(55% 55% at 50% 50%, rgba(167,139,250,0.9), rgba(124,58,237,0.35) 45%, rgba(124,58,237,0.15) 60%, transparent 70%)",
												filter: "blur(6px)",
												zIndex: 0,
											},
										}}
									>
										<Avatar
											src={avatarSrc}
											alt={shownName || "User"}
											sx={{
												width: 96,
												height: 96,
												position: "relative",
												zIndex: 1,
												borderRadius: "50%",
												border: "2px solid rgba(167,139,250,0.9)",
												boxShadow:
													"0 0 12px rgba(124,58,237,0.65), 0 0 24px rgba(124,58,237,0.35), 0 8px 30px rgba(0,0,0,0.6)",
												background: "#111",
											}}
										/>
									</Box>
									<Box>
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography variant="h5" fontWeight={900} sx={{ color: "#fff", textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>
												{shownName}
											</Typography>
										{verifiedShow && (
												<Box sx={{ position: "relative", ml: 0.25, lineHeight: 0 }}>
													{/* Expanding ring halo */}
													<Box
														aria-hidden
														sx={{
															position: "absolute",
															inset: -4,
															borderRadius: "9999px",
															border: "2px solid rgba(96,165,250,0.6)",
															boxShadow: "0 0 12px rgba(96,165,250,0.6)",
															animation: `${ringPulse} 2.2s ease-in-out infinite`,
														}}
													/>
													<VerifiedIcon
														sx={{
															color: "#60a5fa",
															fontSize: 22,
															animation: `${tickPulse} 1.6s ease-in-out infinite`,
														}}
														titleAccess="Verified"
													/>
												</Box>
											)}
										</Stack>

										<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, flexWrap: "wrap" }}>
											{/* Discord handle chip with FontAwesome icon */}
											<Chip
												size="small"
												icon={<FontAwesomeIcon icon={byPrefixAndName.fab["discord"]} style={{ color: "#5865F2", width: 14, height: 14 }} />}
												label={`@${slugify(shownName)}`}
												variant="outlined"
												sx={{ color: "#fff", bgcolor: "#000", borderColor: "rgba(255,255,255,0.28)" }}
											/>

											{/* Steam chip or Link button placed next to Discord */}
											{(isOwnProfile ? steamLoading : publicLoading) ? (
												<Skeleton variant="rounded" width={120} height={24} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: 1 }} />
											) : steamForView ? (
												<Chip
													size="small"
													icon={<FontAwesomeIcon icon={byPrefixAndName.fab["steam"]} style={{ color: "#66c0f4", width: 14, height: 14 }} />}
													label={steamForView.name ? `Steam: ${steamForView.name}` : "Steam"}
													variant="outlined"
													component="a"
													clickable
													href={`https://steamcommunity.com/profiles/${steamForView.id}`}
													target="_blank"
													rel="noreferrer"
													sx={{ color: "#fff", bgcolor: "#000", borderColor: "rgba(102,192,244,0.55)" }}
												/>
											) : isOwnProfile ? (
												<Button
													size="small"
													startIcon={<FontAwesomeIcon icon={byPrefixAndName.fab["steam"]} style={{ color: "#66c0f4" }} />}
													variant="outlined"
													onClick={linkSteam}
													sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)", textTransform: "none", borderRadius: 2, px: 1.25 }}
												>
													Link Steam
												</Button>
											) : null}

											{/* Membership chip: own profile only */}
											{isOwnProfile && (
												<Chip
													size="small"
													label={tierMeta.label}
													variant="outlined"
													sx={{
														color: "#fff",
														borderColor: "rgba(255,255,255,0.28)",
														background: tierMeta.gradient,
													}}
												/>
											)}

											{/* Admin chip: always show if current user is admin */}
											{isAdmin && (
												<Chip
													size="small"
													icon={<ShieldIcon />}
													label="Admin"
													variant="outlined"
													sx={{
														color: "#22c55e",
														bgcolor: "#000",
														borderColor: "rgba(34,197,94,0.35)",
													}}
												/>
											)}
										</Stack>
									</Box>
								</Stack>
							</Box>
							{/* Statistics */}
							<Typography variant="h5" fontWeight={900} sx={{ color: "#fff", mt: 3, mb: 1.5 }}>
								Statistics
							</Typography>
							{!stats.topSpeedKmh && !stats.distanceKm && !stats.longestKm && !stats.points ? (
								<StatsSkeletonGrid />
							) : (
								<GridStats
									stats={stats}
								/>
							)}
						</>
					)}

					{tab === "subscriptions" && (
						<>
							<Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />
							<Box>
								<Typography variant="h5" fontWeight={900} sx={{ color: "#fff", mb: 1.5 }}>
									Your memberships
								</Typography>
								{levels.length === 0 ? (
									<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
										No VIP tiers owned yet.
									</Typography>
								) : (
									<Stack direction="row" spacing={1} flexWrap="wrap">
										{[...new Set(levels)].sort((a, b) => a - b).map((lvl) => (
											<Chip
												key={`lvl-${lvl}`}
												size="small"
												label={tierNameByLevel[lvl] || `Tier ${lvl}`}
												sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)", background: tierGradientByLevel[lvl] || "linear-gradient(90deg,#374151,#6b7280)" }}
												variant="outlined"
											/>
										))}
									</Stack>
								)}
							</Box>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
								<Button href="/membership" variant="contained" disableElevation sx={{ bgcolor: "#fff", color: "#0b0b0b", fontWeight: 900 }}>
									Explore Plans
								</Button>
								<Button href="/gift/redeem" variant="text" sx={{ color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" }}>
									Redeem a Gift
								</Button>
								<Button onClick={refreshMembership} variant="outlined" disabled={refreshingMembership} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)" }}>
									{refreshingMembership ? "Refreshing..." : "Refresh from Discord"}
								</Button>
							</Stack>
						</>
					)}

					{tab === "friends" && (
						<Box sx={{ py: 8, textAlign: "center", color: "#e5e7eb", borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
							<Typography variant="h6" sx={{ opacity: 0.95 }}>Friends coming soon.</Typography>
						</Box>
					)}

					{tab === "edit" && (
						<Box sx={{ py: 8, textAlign: "center", color: "#e5e7eb", borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
							<Typography variant="h6" sx={{ opacity: 0.95 }}>Edit profile coming soon.</Typography>
						</Box>
					)}
					{tab === "transactions" && (
						<Box sx={{ py: 8, textAlign: "center", color: "#e5e7eb", borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
							<Typography variant="h6" sx={{ opacity: 0.95 }}>Transactions coming soon.</Typography>
						</Box>
					)}
				</Box>
			</Paper>

			{/* Share modal */}
			<Dialog
				open={shareOpen}
				onClose={closeShare}
				fullWidth
				maxWidth="xs"
				PaperProps={{ sx: { bgcolor: "#0b0b0b", border: "1px solid rgba(255,255,255,0.08)" } }}
			>
				<DialogTitle sx={{ color: "#fff" }}>Share this profile</DialogTitle>
				<DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
					<List dense>
						<ListItemButton onClick={shareProfile} sx={{ color: "#fff" }}>
							<ListItemIcon><ShareOutlinedIcon sx={{ color: "#cbd5e1" }} /></ListItemIcon>
							<ListItemText primary="Share with device" secondary="Use the native share sheet" />
						</ListItemButton>
						<ListItemButton onClick={copyLink} sx={{ color: "#fff" }}>
							<ListItemIcon><ContentCopyOutlinedIcon sx={{ color: copied ? "#22c55e" : "#cbd5e1" }} /></ListItemIcon>
							<ListItemText primary={copied ? "Link copied!" : "Copy link"} secondary={getShareUrl()} />
						</ListItemButton>
						<ListItemButton onClick={() => shareTo("twitter")} sx={{ color: "#fff" }}>
							<ListItemIcon><TwitterIcon sx={{ color: "#1DA1F2" }} /></ListItemIcon>
							<ListItemText primary="Share on X (Twitter)" />
						</ListItemButton>
						<ListItemButton onClick={() => shareTo("facebook")} sx={{ color: "#fff" }}>
							<ListItemIcon><FacebookOutlinedIcon sx={{ color: "#1877F2" }} /></ListItemIcon>
							<ListItemText primary="Share on Facebook" />
						</ListItemButton>
						<ListItemButton onClick={() => shareTo("reddit")} sx={{ color: "#fff" }}>
							<ListItemIcon><RedditIcon sx={{ color: "#FF4500" }} /></ListItemIcon>
							<ListItemText primary="Share on Reddit" />
						</ListItemButton>
						<ListItemButton onClick={() => shareTo("whatsapp")} sx={{ color: "#fff" }}>
							<ListItemIcon><WhatsAppIcon sx={{ color: "#25D366" }} /></ListItemIcon>
							<ListItemText primary="Share on WhatsApp" />
						</ListItemButton>
						<ListItemButton onClick={() => shareTo("telegram")} sx={{ color: "#fff" }}>
							<ListItemIcon><TelegramIcon sx={{ color: "#24A1DE" }} /></ListItemIcon>
							<ListItemText primary="Share on Telegram" />
						</ListItemButton>
						<ListItemButton onClick={() => shareTo("email")} sx={{ color: "#fff" }}>
							<ListItemIcon><EmailOutlinedIcon sx={{ color: "#cbd5e1" }} /></ListItemIcon>
							<ListItemText primary="Share via Email" />
						</ListItemButton>
					</List>
				</DialogContent>
			</Dialog>
		</Box>
	);
}

// Lightweight stats component (keeps page readable)
function GridStats({ stats }: { stats: { topSpeedKmh: number | null; distanceKm: number | null; longestKm: number | null; points: number | null } }) {
	const CardBox = ({ icon, title, value, unit }: { icon: React.ReactNode; title: string; value: string; unit?: string }) => (
		<Card
			variant="outlined"
			sx={{
				flex: 1,
				minWidth: 260,
				borderRadius: 2,
				borderColor: "rgba(255,255,255,0.06)",
				background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.3))",
			}}
		>
			<CardContent>
				<Stack spacing={1}>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#c7bdfc" }}>
						{icon}
						<Typography variant="caption" sx={{ color: "#c7bdfc", fontWeight: 700 }}>{title}</Typography>
					</Stack>
					<Stack direction="row" spacing={1} alignItems="baseline">
						<Typography variant="h5" sx={{ color: "#fff", fontWeight: 900 }}>{value}</Typography>
						{unit && <Typography variant="h6" sx={{ color: "#fff", opacity: 0.85 }}>{unit}</Typography>}
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
	return (
		<Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 1.5, overflow: "hidden" }}>
			<CardBox icon={<SpeedOutlinedIcon fontSize="small" />} title="Top Speed Achieved" value={stats.topSpeedKmh ? String(stats.topSpeedKmh) : "0"} unit="km/h" />
			<CardBox icon={<RouteOutlinedIcon fontSize="small" />} title="Distance Driven" value={stats.distanceKm ? String(stats.distanceKm) : "0"} unit="km" />
			<CardBox icon={<TimelineOutlinedIcon fontSize="small" />} title="Top Distance in one Session" value={stats.longestKm ? String(stats.longestKm) : "0"} unit="km" />
			<CardBox icon={<EmojiEventsOutlinedIcon fontSize="small" />} title="Points Record" value={stats.points ? String(stats.points) : "0"} />
		</Box>
	);
}

// Skeleton grid shown while stats are loading or not available
function StatsSkeletonGrid() {
	const CardSkeleton = () => (
		<Card
			variant="outlined"
			sx={{
				flex: 1,
				minWidth: 260,
				borderRadius: 2,
				borderColor: "rgba(255,255,255,0.06)",
				background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.3))",
			}}
		>
			<CardContent>
				<Stack spacing={1.5}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Skeleton animation="wave" variant="circular" width={18} height={18} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
						<Skeleton animation="wave" variant="text" width={120} height={16} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
					</Stack>
					<Skeleton animation="wave" variant="text" width={140} height={36} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
					<Skeleton animation="wave" variant="text" width={80} height={22} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
				</Stack>
			</CardContent>
		</Card>
	);
	return (
		<Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 1.5, overflow: "hidden" }}>
			<CardSkeleton />
			<CardSkeleton />
			<CardSkeleton />
			<CardSkeleton />
		</Box>
	);
}
