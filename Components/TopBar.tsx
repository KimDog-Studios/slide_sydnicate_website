"use client"
import React, { useEffect, useState, useRef } from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import StorageIcon from '@mui/icons-material/Storage'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import LoginIcon from '@mui/icons-material/Login'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import { useRouter } from 'next/navigation'

function TopBar() {
	const router = useRouter();
	const [user, setUser] = useState<{ displayName: string; avatar?: string | null; tier?: string | null } | null>(null);
	const [loading, setLoading] = useState(true);
	const [menuOpen, setMenuOpen] = useState(false);
	const [navOpen, setNavOpen] = useState(false);
	const userBoxRef = useRef<HTMLDivElement | null>(null);
	const [scrolled, setScrolled] = useState(false);
	const [active, setActive] = useState<string | null>(null);
	const [isGuildMember, setIsGuildMember] = useState(false);

	useEffect(() => {
		const on = () => setScrolled(window.scrollY > 6);
		on();
		window.addEventListener("scroll", on);
		return () => window.removeEventListener("scroll", on);
	}, []);

	// Highlight active nav section (if sections exist on the page)
	useEffect(() => {
		if (typeof window === "undefined") return;
		const ids = ["about", "partners", "contact"];
		const els = ids
			.map((id) => {
				const el = document.getElementById(id);
				return el ? { id, el } : null;
			})
			.filter(Boolean) as Array<{ id: string; el: Element }>;
		if (els.length === 0) return;
		let ticking = false;
		const io = new IntersectionObserver(
			(entries) => {
				// pick the most visible one
				const vis = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
				if (!ticking) {
					ticking = true;
					requestAnimationFrame(() => {
						setActive(vis[0]?.target.id ?? null);
						ticking = false;
					});
				}
			},
			{ rootMargin: "0px 0px -30% 0px", threshold: [0.2, 0.4, 0.6, 0.8] }
		);
		els.forEach(({ el }) => io.observe(el));
		return () => io.disconnect();
	}, []);

	// If Discord redirected to the site root with ?code=..., forward it to our callback API
	useEffect(() => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		const code = url.searchParams.get("code");
		const discErr = url.searchParams.get("error");
		if (code && !discErr) {
			// preserve state if present
			const state = url.searchParams.get("state");
			const cb = `${window.location.origin}/api/auth/discord/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
			// Avoid double handling
			window.location.replace(cb);
		}
	}, []);

	// Discord OAuth redirect (build with canonical redirect_uri)
	const handleDiscordLogin = () => {
		const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "";
		const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "";
		const scopes = process.env.NEXT_PUBLIC_DISCORD_SCOPES || "identify guilds guilds.channels.read role_connections.write gdm.join guilds.members.read openid";
		if (!clientId || !redirectUri) {
			console.error("Discord OAuth env missing. Set NEXT_PUBLIC_DISCORD_CLIENT_ID and NEXT_PUBLIC_DISCORD_REDIRECT_URI");
			return;
		}
		const params = new URLSearchParams({
			client_id: clientId,
			response_type: "code",
			redirect_uri: redirectUri,
			scope: scopes,
		});
		window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`;
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		} catch {}
		setUser(null);
		setMenuOpen(false);
		setNavOpen(false);
		// refresh UI
		if (typeof window !== "undefined") window.location.replace("/");
	};

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const res = await fetch("/api/auth/session", { cache: "no-store", credentials: "include" });
				if (!res.ok) return;
				const data = await res.json();
				if (active && data?.authenticated && data?.user) {
					setUser({ displayName: data.user.displayName, avatar: data.user.avatar, tier: data.user.tier ?? null });
				}
			} catch {
				/* ignore */
			} finally {
				if (active) setLoading(false);
			}
		})()
		return () => { active = false; };
	}, []);

	// Map highest owned level to tier name (keep in sync with profile page)
	const deriveTierNameFromLevels = (levels: number[] | null | undefined): string | null => {
		if (!Array.isArray(levels) || levels.length === 0) return null;
		const max = Math.max(...levels.filter((n) => typeof n === "number" && !Number.isNaN(n)));
		if (max >= 3) return "Pro Line";
		if (max === 2) return "Tandem Club";
		if (max === 1) return "Streetline";
		return "Beginner Access";
	};
	// Rank tiers to avoid demoting once we know a higher tier
	const rankOfTier = (t?: string | null) => {
		const k = String(t || "").toLowerCase();
		if (!k) return -1;
		if (k.includes("pro")) return 3;
		if (k.includes("tandem")) return 2;
		if (k.includes("street")) return 1;
		return 0; // beginner
	};

	// Try to sync tier from /api/auth/subscription-status
	const syncTierFromSubscription = async () => {
		try {
			const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
			if (!r.ok) return;
			const j = await r.json().catch(() => null);
			const levels: number[] = Array.isArray(j?.levels) ? j.levels.map((n: unknown) => Number(n)).filter((n: number) => !Number.isNaN(n)) : [];
			const derived = deriveTierNameFromLevels(levels);
			if (derived) {
				setUser((prev) => {
					if (!prev) return prev;
					const currRank = rankOfTier(prev.tier);
					const nextRank = rankOfTier(derived);
					return nextRank >= currRank ? { ...prev, tier: derived } : prev;
				});
			}
		} catch {}
	};

	// After session, pull live Discord snapshot to backfill tier/levels if roles already exist on the server
	useEffect(() => {
		let alive = true;
		(async () => {
			if (!user) return;
			// First, try the subscription endpoint (same source Subscriptions tab uses)
			await syncTierFromSubscription();
			// Then, pull the Discord snapshot as a fallback/confirm
			try {
				const r = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
				if (!r.ok) return;
				const j = await r.json().catch(() => null);
				if (!alive || !j) return;
				const levels: number[] = Array.isArray(j.levels) ? j.levels.map((n: unknown) => Number(n)).filter((n: number) => !Number.isNaN(n)) : [];
				const derived = deriveTierNameFromLevels(levels);
				const best = j.tier ?? derived ?? null; // prefer snapshot tier
				if (best) {
					setUser((prev) => {
						if (!prev) return prev;
						const currRank = rankOfTier(prev.tier);
						const nextRank = rankOfTier(best);
						return nextRank >= currRank ? { ...prev, tier: best } : prev;
					});
				}
			} catch {}
		})();
		return () => { alive = false; };
	// Only run when we first get a user object (avoid loops on tier updates)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [!!user]);

	// When logged in, check if the user is a member of the guild and hide the CTA if so
	useEffect(() => {
		let alive = true;
		(async () => {
			if (!user) { if (alive) setIsGuildMember(false); return; }
			try {
				const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
				// 404 => not in guild
				if (!r.ok) { if (alive) setIsGuildMember(false); return; }
				const j = await r.json().catch(() => null);
				const joinedAt = (j?.joinedAt ?? j?.joined_at) || null;
				const roles = Array.isArray(j?.roles) ? j.roles : [];
				const levels = Array.isArray(j?.levels) ? j.levels : [];
				// Update tier here too to keep header consistent with Subscriptions tab
				if (levels.length) {
					const derived = deriveTierNameFromLevels(levels.map((n: unknown) => Number(n)).filter((n: number) => !Number.isNaN(n)));
					if (derived) {
						setUser((prev) => {
							if (!prev) return prev;
							const currRank = rankOfTier(prev.tier);
							const nextRank = rankOfTier(derived);
							return nextRank >= currRank ? { ...prev, tier: derived } : prev;
						});
					}
				}
				const isMemberFlag = j?.isMember === true || j?.is_member === true;
				// Member iff joinedAt present OR any roles/levels OR explicit isMember flag
				let member = Boolean(joinedAt) || roles.length > 0 || levels.length > 0 || isMemberFlag;
				// Strengthen membership signal with direct Discord snapshot if available
				try {
					const m = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
					if (m.ok) {
						const mj = await m.json().catch(() => null);
						const mJoined = (mj?.joinedAt ?? mj?.joined_at) || null;
						const mRoles = Array.isArray(mj?.roles) ? mj.roles : [];
						const mLevels = Array.isArray(mj?.levels) ? mj.levels : [];
						// If Discord snapshot has more up-to-date levels, use it
						if (mLevels.length) {
							const derived = deriveTierNameFromLevels(mLevels.map((n: unknown) => Number(n)).filter((n: number) => !Number.isNaN(n)));
							if (derived) {
								setUser((prev) => {
									if (!prev) return prev;
									const currRank = rankOfTier(prev.tier);
									const nextRank = rankOfTier(derived);
									return nextRank >= currRank ? { ...prev, tier: derived } : prev;
								});
							}
						}
						const mFlag = mj?.isMember === true;
						member = member || Boolean(mJoined) || mRoles.length > 0 || mLevels.length > 0 || mFlag;
					}
				} catch {}
				if (alive) setIsGuildMember(member);
			} catch {
				if (alive) setIsGuildMember(false);
			}
		})();
		return () => { alive = false; };
	}, [user]);

	// Close menus on outside click or Escape
	useEffect(() => {
		if (!menuOpen && !navOpen) return;
		const onDocClick = (e: MouseEvent) => {
			if (!userBoxRef.current) return;
			const tgt = e.target as Node;
			const clickedAvatar = userBoxRef.current.contains(tgt);
			if (!clickedAvatar) setMenuOpen(false);
			// close mobile nav if clicking outside any nav container
			const navRoot = document.getElementById("ss-topbar-root");
			if (navRoot && !navRoot.contains(tgt)) setNavOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setMenuOpen(false);
				setNavOpen(false);
			}
		};
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [menuOpen, navOpen]);

	// Tier helpers aligned to Membership tiers
	const getTierMeta = (t?: string | null) => {
		const k = (t ?? "").toLowerCase().trim();
		if (k === "beginner access" || k === "tier 0" || k === "public" || k === "beginner") {
			return { label: "Beginner Access", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
		}
		if (k === "streetline" || k === "tier 1") {
			return { label: "Streetline", gradient: "linear-gradient(90deg,#3b82f6,#06b6d4)" };
		}
		if (k === "tandem club" || k === "tier 2") {
			return { label: "Tandem Club", gradient: "linear-gradient(90deg,#a855f7,#f59e0b)" };
		}
		if (k === "pro line" || k === "tier 3" || k === "pro") {
			return { label: "Pro Line", gradient: "linear-gradient(90deg,#ff3d6e,#ff8c42)" };
		}
		return { label: "Beginner Access", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
	};
	const tierLabel = (t?: string | null) => getTierMeta(t).label;
	const tierColor = (t?: string | null) => getTierMeta(t).gradient;

	// Shared styles
	const glass = {
		background: 'linear-gradient(180deg, rgba(14,10,20,0.70), rgba(14,10,20,0.46))',
		border: '1px solid rgba(167,139,250,0.22)',
		boxShadow: '0 10px 30px rgba(124,58,237,0.22), inset 0 0 0 1px rgba(255,255,255,0.02)',
		backdropFilter: 'blur(10px)',
	} as const;
	const pill = {
		borderRadius: 8,
		border: '1px solid rgba(255,255,255,0.06)',
	} as const;

	// helpers: navigate and profile tab jump
	const go = (path: string) => {
		setMenuOpen(false);
		try {
			router.push(path);
			// ensure server components revalidate when needed
			if (typeof router.refresh === "function") router.refresh();
		} catch {
			if (typeof window !== "undefined") window.location.assign(path);
		}
	};
	const goProfileTab = (tab: string) => {
		const path = `/profile?tab=${encodeURIComponent(tab)}`;
		setMenuOpen(false);
		setNavOpen(false);
		try {
			// If already on /profile, force a full reload to ensure the tab reflects immediately
			if (typeof window !== "undefined" && window.location.pathname.startsWith("/profile")) {
				window.location.assign(path);
				return;
			}
			router.push(path);
			if (typeof router.refresh === "function") router.refresh();
		} catch {
			if (typeof window !== "undefined") window.location.assign(path);
		}
	};

	return (
		<nav
			id="ss-topbar-root"
			className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
			style={{ width: '100%', paddingLeft: 16, paddingRight: 16 }}
			aria-label="Main Navigation"
		>
			<div
				className={`ss-nav${scrolled ? " scrolled" : ""}`}
				style={{
					...glass,
					borderRadius: 12,
					padding: scrolled ? '8px 12px' : '10px 14px',
					maxWidth: 1280,
					margin: '0 auto',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					{/* Left: logo */}
					<div className="shrink-0" style={{ padding: '4px 8px', borderRadius: 8 }}>
						<a
							href="/"
							className="ss-logo font-semibold"
							aria-label="Home"
							title="Home"
							style={{
								letterSpacing: 0.4,
								fontSize: 14,
								background: 'linear-gradient(90deg,#c4b5fd,#7c3aed)',
								WebkitBackgroundClip: 'text',
								color: 'transparent',
								textShadow: '0 0 10px rgba(124,58,237,0.55)',
								textDecoration: 'none',
							}}
						>
							SlideSyndicate
						</a>
					</div>

					{/* Center: nav links */}
					<ul className="hidden md:flex items-center gap-6 list-none m-0 p-0 text-sm" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
						<li>
							<a
								href="/about"
								className={`ss-link${active === "about" ? " active" : ""}`}
								aria-current={active === "about" ? "page" : undefined}
								style={{ padding: '6px 4px' }}
								onClick={() => setNavOpen(false)}
							>
								About Us
							</a>
						</li>
						<li>
							<a
								href="/partners"
								className={`ss-link${active === "partners" ? " active" : ""}`}
								aria-current={active === "partners" ? "page" : undefined}
								style={{ padding: '6px 4px' }}
								onClick={() => setNavOpen(false)}
							>
								Partners
							</a>
						</li>
						<li>
							<a
								href="/contact-us"
								className={`ss-link${active === "contact" ? " active" : ""}`}
								aria-current={active === "contact" ? "page" : undefined}
								style={{ padding: '6px 4px' }}
								onClick={() => setNavOpen(false)}
							>
								Contact
							</a>
						</li>
						<li>
							<a
								href="/gift/redeem"
								className="ss-link"
								style={{ padding: '6px 4px' }}
								onClick={() => setNavOpen(false)}
							>
								Redeem
							</a>
						</li>
					</ul>

					{/* Right: actions */}
					<div className="shrink-0" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<a
							href="/downloads"
							className="hidden sm:inline-flex items-center text-sm ss-btn-ghost"
							style={{
								...pill,
								padding: '8px 10px',
								color: '#f5f5ff',
								textDecoration: 'none',
								transition: 'transform 120ms ease',
							}}
							onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
							onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
						>
							<DownloadOutlinedIcon style={{ color: '#c4b5fd', filter: 'drop-shadow(0 0 10px #7c3aed)', marginRight: 6 }} fontSize="small" />
							<span style={{ fontWeight: 700 }}>Downloads</span>
						</a>
						<a
							href="/servers"
							className="hidden sm:inline-flex items-center text-sm ss-btn-ghost"
							style={{
								...pill,
								padding: '8px 10px',
								color: '#f5f5ff',
								textDecoration: 'none',
								transition: 'transform 120ms ease',
							}}
							onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
							onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
						>
							<StorageIcon style={{ color: '#c4b5fd', filter: 'drop-shadow(0 0 10px #7c3aed)', marginRight: 6 }} fontSize="small" />
							<span style={{ fontWeight: 700 }}>Servers</span>
                        </a>

						{/* Join Discord CTA (hidden if logged in and already in guild) */}
						{(process.env.NEXT_PUBLIC_DISCORD_INVITE || "").trim() && !(user && isGuildMember) ? (
							<a
								href={(process.env.NEXT_PUBLIC_DISCORD_INVITE || "").trim()}
								target="_blank"
								rel="noopener noreferrer"
								className="hidden sm:inline-flex items-center text-sm ss-btn"
								aria-label="Join our Discord"
								title="Join our Discord"
								style={{
									...pill,
									padding: '8px 10px',
									color: '#fff',
									textDecoration: 'none',
									transition: 'transform 120ms ease',
								}}
								onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
								onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
							>
								<span style={{ fontWeight: 800 }}>Join Discord</span>
							</a>
						) : null}

						{/* Auth section */}
						{user ? (
							<div ref={userBoxRef} style={{ position: 'relative' }}>
								<button
									type="button"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 8,
										padding: '4px 6px',
										borderRadius: 999,
										border: '1px solid rgba(167,139,250,0.55)',
										background: 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(167,139,250,0.9))',
										color: '#fff',
										fontWeight: 800,
										boxShadow: '0 0 16px rgba(124,58,237,0.35), 0 0 24px rgba(167,139,250,0.25)',
										cursor: 'pointer',
									}}
									aria-label="Current user"
									title={user.displayName}
									onClick={() => setMenuOpen((v) => !v)}
									aria-haspopup="menu"
									aria-expanded={menuOpen}
								>
									{user.avatar ? (
										<img
											src={user.avatar}
											alt={user.displayName}
											width={32}
											height={32}
											style={{
												borderRadius: '9999px',
												border: '1px solid rgba(255,255,255,0.18)',
												boxShadow: '0 0 10px rgba(124,58,237,0.28)',
											}}
										/>
									) : (
										<div
											style={{
												width: 32,
												height: 32,
												borderRadius: '9999px',
												background: 'linear-gradient(90deg,#6d28d9,#a78bfa)',
												border: '1px solid rgba(255,255,255,0.18)',
												boxShadow: '0 0 10px rgba(124,58,237,0.28)',
											}}
											aria-hidden
										/>
									)}
									<span style={{ textShadow: '0 0 8px rgba(255,255,255,0.18)', fontSize: 13 }}>{user.displayName}</span>
									{user.tier ? (
										<span
											style={{
												marginLeft: 6,
												padding: '2px 8px',
												borderRadius: 999,
												background: tierColor(user.tier),
												color: '#fff',
												fontSize: 11,
												fontWeight: 900,
												lineHeight: '14px',
												boxShadow: '0 0 8px rgba(124,58,237,0.35)',
												border: '1px solid rgba(255,255,255,0.06)',
											}}
										>
											{tierLabel(user.tier)}
										</span>
									) : null}
								</button>

								{menuOpen && (
									<div
										role="menu"
										aria-label="Profile menu"
										style={{
											position: 'absolute',
											right: 0,
											top: 'calc(100% + 10px)',
											minWidth: 280,
											padding: 12,
											borderRadius: 16,
											background: 'linear-gradient(180deg, rgba(14,10,20,0.92), rgba(14,10,20,0.78))',
											border: '1px solid rgba(255,255,255,0.08)',
											boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
											backdropFilter: 'blur(10px)',
											zIndex: 100,
										}}
									>
										{/* Header */}
										<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 6 }}>
											<div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 800 }}>{user.displayName}</div>
											{user.tier ? (
												<span style={{
													marginLeft: 'auto',
													padding: '2px 8px',
													borderRadius: 999,
													background: tierColor(user.tier),
													color: '#fff',
													fontSize: 11,
													fontWeight: 900,
													border: '1px solid rgba(255,255,255,0.06)',
												}}>
													{tierLabel(user.tier)}
												</span>
											) : null}
										</div>

										{/* Items */}
										<div role="group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
											<MenuItem icon={<HomeOutlinedIcon />} label="Home" onClick={() => goProfileTab('home')} />
											<MenuItem icon={<EmojiEventsOutlinedIcon />} label="Leaderboard" onClick={() => go('/leaderboard')} />
											<MenuItem icon={<GroupOutlinedIcon />} label="Friends" onClick={() => goProfileTab('friends')} />
											<MenuItem icon={<EditOutlinedIcon />} label="Edit Profile" onClick={() => goProfileTab('edit')} />
											<MenuItem icon={<Inventory2OutlinedIcon />} label="Subscriptions" onClick={() => goProfileTab('subscriptions')} />
											<MenuItem icon={<ReceiptLongOutlinedIcon />} label="Transactions" onClick={() => goProfileTab('transactions')} />
										</div>
										<hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />
										<MenuItem icon={<LogoutOutlinedIcon />} label="Log Out" onClick={handleLogout} danger />
									</div>
								)}
							</div>
						) : !loading && (
							<button
								type="button"
								onClick={handleDiscordLogin}
								aria-label="Login with Discord"
								title="Login with Discord"
								className="inline-flex items-center text-sm font-semibold ss-btn"
								style={{
									...pill,
									padding: '8px 12px',
									color: '#fff',
									transition: 'transform 120ms ease',
								}}
								onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
								onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
							>
								<LoginIcon style={{ color: '#fff', filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.9))', marginRight: 6 }} fontSize="small" />
								<span style={{ textShadow: '0 0 8px rgba(255,255,255,0.18)' }}>Login</span>
							</button>
						)}

						{/* Mobile menu toggle */}
						<button
							className="md:hidden p-1 rounded-sm text-sm"
							aria-label="Open menu"
							aria-expanded={navOpen}
							onClick={() => setNavOpen((v) => !v)}
							style={{ color: '#f5f5ff', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
						>
							<MenuIcon style={{ color: '#c4b5fd', filter: 'drop-shadow(0 0 8px #7c3aed)' }} fontSize="small" />
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu panel */}
			{navOpen && (
				<div
					style={{
						...glass,
						maxWidth: 1280,
						margin: '8px auto 0',
						borderRadius: 12,
						padding: 12,
						animation: 'ssFadeInUp 160ms ease',
					}}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						<a href="#about" onClick={() => setNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>About Us</a>
						<a href="#partners" onClick={() => setNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Partners</a>
						<a href="#contact" onClick={() => setNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Contact</a>
						<a href="/gift/redeem" onClick={() => setNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Redeem</a>
						{user && (
							<a href="/profile" onClick={() => setNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
								Profile
							</a>
						)}
						<a href="/downloads" onClick={() => setNavOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
							Downloads
						</a>
						<a href="/servers" style={{ color: '#c4b5fd', textDecoration: 'none', fontWeight: 800, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
							<StorageIcon fontSize="small" /> Servers
						</a>
						{/* ...existing login/logout buttons... */}
					</div>
				</div>
			)}
			<style>{`
				:root {
					--ss-accent: #7c3aed;
					--ss-accent-2: #a78bfa;
					--ss-neon: #b388ff;
					--ss-neon-2: #8a63ff;
				}
				/* Neon border wrapper */
				.ss-nav { position: relative; }
				.ss-nav::before {
					content: "";
					position: absolute;
					inset: -1px;
					border-radius: 14px;
					padding: 1px;
					background: linear-gradient(90deg, var(--ss-accent), var(--ss-neon), var(--ss-accent-2));
					-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
					-webkit-mask-composite: xor;
					        mask-composite: exclude;
					opacity: 0.45;
					pointer-events: none;
					transition: opacity .2s ease;
				}
				.ss-nav.scrolled::before { opacity: 0.7; }

				/* Modern link underline */
				.ss-link {
					color: #e9e3ff;
					text-decoration: none;
					font-weight: 600;
					position: relative;
					outline: none;
				}
				.ss-link::after {
					content: "";
					position: absolute;
					left: 0;
					right: 100%;
					bottom: -2px;
					height: 2px;
					background: linear-gradient(90deg, var(--ss-accent-2), var(--ss-neon));
					box-shadow: 0 0 10px rgba(124,58,237,0.75);
					transition: right .22s ease;
				}
				.ss-link:hover::after, .ss-link.active::after { right: 0; }
				.ss-link:focus-visible {
					box-shadow: 0 0 0 2px rgba(167,139,250,0.65);
					border-radius: 6px;
				}

				/* Shimmer CTA */
				.ss-btn {
					background: linear-gradient(90deg, #6d28d9, #a78bfa, #6d28d9);
					background-size: 200% 100%;
					box-shadow: 0 10px 26px rgba(124,58,237,0.30), 0 0 18px rgba(124,58,237,0.45);
					animation: ssShimmer 5s linear infinite;
					border: 1px solid rgba(255,255,255,0.06);
					border-radius: 8px;
				}
				@keyframes ssShimmer {
					0% { background-position: 0% 50%; }
					100% { background-position: 200% 50%; }
				}

				/* Ghost button with neon hover */
				.ss-btn-ghost {
					background: linear-gradient(180deg, rgba(124,58,237,0.10), rgba(124,58,237,0.06));
					border: 1px solid rgba(255,255,255,0.06);
					border-radius: 8px;
					box-shadow: 0 6px 14px rgba(124,58,237,0.18);
				}
				.ss-btn-ghost:hover {
					box-shadow: 0 10px 20px rgba(124,58,237,0.32), 0 0 20px rgba(167,139,250,0.25);
				}

				/* Fade in up animation for panels */
				@keyframes ssFadeInUp {
					from { opacity: 0; transform: translateY(6px); }
					to { opacity: 1; transform: translateY(0); }
				}
				/* Animate dropdown panel */
				[role="menu"] { animation: ssFadeInUp 140ms ease; }

				/* Focus rings for buttons */
				button:focus-visible, .ss-btn-ghost:focus-visible {
					outline: none;
					box-shadow: 0 0 0 2px rgba(167,139,250,0.65);
					border-radius: 8px;
				}

				/* Brand link focus + hover */
				.ss-logo { outline: none; }
				.ss-logo:focus-visible {
					box-shadow: 0 0 0 2px rgba(167,139,250,0.65);
					border-radius: 6px;
				}
				@media (hover: hover) {
					.ss-logo:hover {
						text-shadow: 0 0 12px rgba(124,58,237,0.75);
					}
				}

				/* Respect reduced motion preferences */
				@media (prefers-reduced-motion: reduce) {
					* {
						animation: none !important;
						transition: none !important;
					}
				}
			`}</style>
		</nav>
	)
}

// Small presentational component for menu items
function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
	return (
		<button
			type="button"
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onClick();
				}
			}}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				width: '100%',
				textAlign: 'left',
				padding: '10px 12px',
				borderRadius: 10,
				border: '1px solid rgba(255,255,255,0.06)',
				background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
				color: danger ? '#fca5a5' : '#e5e7eb',
				fontWeight: 800,
				cursor: 'pointer',
			}}
			onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))'; }}
			onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'; }}
		>
			<span style={{ display: 'inline-flex', color: danger ? '#fca5a5' : '#e5e7eb' }}>{icon}</span>
			<span>{label}</span>
		</button>
	);
}

export default TopBar