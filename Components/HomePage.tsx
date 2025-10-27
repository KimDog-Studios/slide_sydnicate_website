import React from 'react'

function HomePage() {
	return (
		<main
			style={{
				fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
				color: '#111',
				fontWeight: 700, // make all fonts bold by default
			}}
		>
			{/* top spacing so content sits under the top bar */}
			<section
				style={{
					padding: '72px 16px', /* more top padding to clear top bar */
					maxWidth: 900,
					margin: '0 auto',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '60vh',
				}}
			>
				{/* Hero (neon text with NO background panel) */}
				<header
					aria-labelledby="hero-title"
					style={{
						textAlign: 'center',
						background: 'transparent', // no background
						color: '#fff', /* neon text remains white */
						padding: '14px 8px', // tightened padding
						width: '100%',
					}}
				>
					<h1
						id="hero-title"
						style={{
							margin: 0,
							fontSize: '1.95rem', // slightly larger title
							lineHeight: 1.05,
							// neon effect
							color: '#fff',
							fontWeight: 800, // stronger weight for title
							textShadow:
								'0 0 8px #7c3aed, 0 0 18px rgba(124,58,237,0.95), 0 0 32px rgba(124,58,237,0.6), 0 2px 0 rgba(0,0,0,0.6)',
						}}
					>
						Slide Syndicate — Assetto Corsa
					</h1>

					<div style={{ marginTop: 18, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
						<p style={{ margin: '8px 0', color: '#f5f5ff', textShadow: '0 0 8px rgba(124,58,237,0.6)', fontSize: '1.06rem', fontWeight: 700 }}>
							Discover custom cars, and Drift Maps.
						</p>
						<p style={{ margin: '8px 0', color: '#f5f5ff', textShadow: '0 0 8px rgba(124,58,237,0.55)', fontSize: '1.06rem', fontWeight: 700 }}>
							Enjoy monthly updates and exclusive content
						</p>
						<p style={{ margin: '8px 0', color: '#f5f5ff', textShadow: '0 0 8px rgba(124,58,237,0.55)', fontSize: '1.06rem', fontWeight: 700 }}>
							and join our community.
						</p>

						<a
							href="#join"
							role="button"
							aria-label="Get started with Drift Syndicate"
							style={{
								display: 'inline-block',
								marginTop: 18,
								background: 'linear-gradient(90deg,#6d28d9,#a78bfa)',
								color: '#fff',
								padding: '12px 22px',
								borderRadius: 10,
								textDecoration: 'none',
								fontWeight: 800,
								fontSize: 16, // slightly larger button text
								boxShadow: '0 8px 30px rgba(124,58,237,0.25), 0 0 22px rgba(124,58,237,0.45)',
								border: '1px solid rgba(255,255,255,0.06)',
							}}
						>
							Get Started
						</a>
					</div>
				</header>
			</section>
		</main>
	)
}

export default HomePage