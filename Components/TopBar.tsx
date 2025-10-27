"use client"
import React from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import StorageIcon from '@mui/icons-material/Storage'
import LoginIcon from '@mui/icons-material/Login'

function TopBar() {
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

				<button
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

				{/* Mobile menu toggle */}
				<button className="md:hidden p-1 rounded-sm text-sm" aria-label="Open menu" style={{ color: '#f5f5ff' }}>
					<MenuIcon style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px #7c3aed)' }} fontSize="small" />
				</button>
			</div>
		</nav>
	)
}

export default TopBar