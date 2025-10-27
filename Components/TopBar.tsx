"use client"
import React, { useEffect, useState, useRef } from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import StorageIcon from '@mui/icons-material/Storage'
import LoginIcon from '@mui/icons-material/Login'

function TopBar() {
	const [user, setUser] = useState<{ displayName: string; avatar?: string | null } | null>(null);
	const [loading, setLoading] = useState(true);
	const [menuOpen, setMenuOpen] = useState(false);
	const userBoxRef = useRef<HTMLDivElement | null>(null);

	// Discord OAuth redirect
	const handleDiscordLogin = () => {
		// Use the exact URL (scopes/redirect) you provided
		const AUTH_URL =
			"https://discord.com/oauth2/authorize?client_id=1432271055304658967&response_type=code&redirect_uri=http%3A%2F%2Fslide-syndicate.com%2Fapi%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds+guilds.channels.read+role_connections.write+gdm.join+guilds.members.read+openid";
		window.location.href = AUTH_URL;
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		} catch {}
		setUser(null);
		setMenuOpen(false);
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
					setUser({ displayName: data.user.displayName, avatar: data.user.avatar });
				}
			} catch {
				/* ignore */
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	// Close menu on outside click or Escape
	useEffect(() => {
		if (!menuOpen) return;
		const onDocClick = (e: MouseEvent) => {
			if (!userBoxRef.current) return;
			if (!userBoxRef.current.contains(e.target as Node)) setMenuOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMenuOpen(false);
		};
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [menuOpen]);

	return (
		<nav
			className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center"
			style={{
				padding: '6px 12%', // keep the wider bar look
				// slightly darker, still a bit transparent so video shows through
				background: 'rgba(0,0,0,0.62)',
				backdropFilter: 'blur(6px)',
				borderRadius: 8,
				border: '1px solid rgba(124,58,237,0.14)', // subtle purple edge
				boxShadow: '0 6px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(124,58,237,0.06)', // soft glow + darker base shadow
			}}
			aria-label="Main Navigation"
		>
			{/* Left: logo (far left) */}
			<div className="shrink-0 mr-4">
				<span
					className="font-semibold text-sm"
					style={{
						color: '#fff',
						letterSpacing: 0.4,
						textShadow: '0 0 8px rgba(124,58,237,0.9), 0 0 14px rgba(124,58,237,0.6)',
					}}
				>
					SlideSyndicate
				</span>
			</div>

			{/* Center: nav links (centered via mx-auto) */}
			<ul className="hidden md:flex items-center gap-2 list-none m-0 p-0 text-sm mx-auto">
				<li>
					<a
						href="#about"
						className="hover:bg-transparent px-2 py-0.5 rounded-sm"
						style={{ color: '#f5f5ff', textShadow: '0 0 8px rgba(124,58,237,0.45)' }}
					>
						About Us
					</a>
				</li>
				<li>
					<a
						href="#partners"
						className="hover:bg-transparent px-2 py-0.5 rounded-sm"
						style={{ color: '#f5f5ff', textShadow: '0 0 8px rgba(124,58,237,0.45)' }}
					>
						Partners
					</a>
				</li>
				<li>
					<a
						href="#contact"
						className="hover:bg-transparent px-2 py-0.5 rounded-sm"
						style={{ color: '#f5f5ff', textShadow: '0 0 8px rgba(124,58,237,0.45)' }}
					>
						Contact
					</a>
				</li>
			</ul>

			{/* Right: actions (far right) */}
			<div className="shrink-0 ml-4 flex items-center gap-1">
				<a
					href="/servers"
					className="hidden sm:inline-flex items-center px-2 py-1 rounded-sm text-sm gap-1"
					style={{
						background: 'transparent',
						border: '1px solid rgba(255,255,255,0.04)',
						color: '#f5f5ff',
						textShadow: '0 0 6px rgba(124,58,237,0.35)',
						textDecoration: 'none',
					}}
				>
					<StorageIcon style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px #7c3aed)' }} fontSize="small" />
					<span>Servers</span>
				</a>

				{user ? (
					<div
						ref={userBoxRef}
						className="inline-flex items-center gap-2 px-2 py-1 rounded-sm"
						style={{
							border: '1px solid rgba(167,139,250,0.65)',
							background: 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(167,139,250,0.9))',
							color: '#fff',
							fontWeight: 700,
							boxShadow: '0 0 16px rgba(124,58,237,0.45), 0 0 36px rgba(167,139,250,0.35)',
							position: 'relative',
							cursor: 'pointer',
						}}
						aria-label="Current user"
						title={user.displayName}
						onClick={() => setMenuOpen((v) => !v)}
					>
						{user.avatar ? (
							<img
								src={user.avatar}
								alt={user.displayName}
								width={36}
								height={36}
								style={{
									borderRadius: '9999px',
									border: '1px solid rgba(255,255,255,0.12)',
									boxShadow: '0 0 10px rgba(124,58,237,0.25)',
								}}
							/>
						) : (
							<div
								style={{
									width: 36,
									height: 36,
									borderRadius: '9999px',
									background: 'linear-gradient(90deg,#6d28d9,#a78bfa)',
									border: '1px solid rgba(255,255,255,0.12)',
									boxShadow: '0 0 10px rgba(124,58,237,0.25)',
								}}
								aria-hidden
							/>
						)}
						<span style={{ textShadow: '0 0 8px rgba(255,255,255,0.12)' }}>{user.displayName}</span>

						{menuOpen && (
							<div
								role="menu"
								style={{
									position: 'absolute',
									right: 0,
									top: 'calc(100% + 8px)',
									minWidth: 160,
									padding: 8,
									borderRadius: 8,
									border: '1px solid rgba(167,139,250,0.65)',
									background: 'linear-gradient(135deg, rgba(24,16,32,0.96), rgba(54,28,88,0.96))',
									boxShadow: '0 12px 30px rgba(124,58,237,0.35), 0 0 24px rgba(167,139,250,0.25)',
									zIndex: 100,
								}}
							>
								<button
									type="button"
									onClick={handleLogout}
									style={{
										width: '100%',
										textAlign: 'left',
										padding: '8px 10px',
										borderRadius: 6,
										border: '1px solid rgba(255,255,255,0.06)',
										background: 'linear-gradient(90deg,#6d28d9,#a78bfa)',
										color: '#fff',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Logout
								</button>
							</div>
						)}
					</div>
				) : !loading && (
					<button
						type="button"
						onClick={handleDiscordLogin}
						aria-label="Login with Discord"
						title="Login with Discord"
						className="inline-flex items-center px-3 py-1 rounded-sm text-white text-sm font-semibold shadow-sm gap-1"
						style={{
							background: 'linear-gradient(90deg,#6d28d9,#a78bfa)',
							boxShadow: '0 8px 30px rgba(124,58,237,0.25), 0 0 18px rgba(124,58,237,0.45)',
							border: '1px solid rgba(255,255,255,0.06)',
						}}
					>
						<LoginIcon style={{ color: '#fff', filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.9))' }} fontSize="small" />
						<span style={{ textShadow: '0 0 8px rgba(255,255,255,0.15)' }}>Login</span>
					</button>
				)}

				{/* Mobile menu toggle */}
				<button className="md:hidden p-1 rounded-sm text-sm" aria-label="Open menu" style={{ color: '#f5f5ff' }}>
					<MenuIcon style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px #7c3aed)' }} fontSize="small" />
				</button>
			</div>
		</nav>
	)
}

export default TopBar