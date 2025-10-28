import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy • Slide Syndicate",
	description: "How Slide Syndicate collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
	const year = new Date().getFullYear();
	return (
		<main style={{ color: "#fff" }}>
			<div style={{ maxWidth: 900, margin: "0 auto", padding: "128px 16px 48px" }}>
				<h1 style={{ fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
				<p style={{ opacity: 0.85, marginBottom: 24 }}>Effective {new Date().toLocaleDateString()}</p>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Overview</h2>
					<p style={{ opacity: 0.9 }}>
						This Privacy Policy explains how we collect, use, and safeguard information related to your account,
						memberships, and interactions with our services (including Discord integrations).
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Information we collect</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>Account identifiers (e.g., Discord user ID, display name, avatar).</li>
						<li>Guild membership and role assignment status for access control.</li>
						<li>Technical data (IP address, device/browser info) for security and analytics.</li>
						<li>Purchase and gift redemption metadata (no full payment details are stored by us).</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>How we use information</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>Authenticate users and manage access to servers and roles.</li>
						<li>Provide and improve membership features and support.</li>
						<li>Detect abuse, enforce policies, and protect our community.</li>
						<li>Comply with legal obligations and respond to lawful requests.</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Cookies and similar technologies</h2>
					<p style={{ opacity: 0.9 }}>
						We use essential cookies for sign-in and session management and may use analytics cookies to improve the site.
						You can control cookies in your browser. For details, see our Cookie Policy.
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Data sharing</h2>
					<p style={{ opacity: 0.9 }}>
						We share information with service providers strictly to operate core features (e.g., Discord for role management,
						payment processors for billing). We do not sell your personal data.
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Data retention</h2>
					<p style={{ opacity: 0.9 }}>
						We retain data only as long as necessary for the purposes described above or as required by law. When no longer needed,
						information is deleted or de-identified.
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Your rights</h2>
					<p style={{ opacity: 0.9 }}>
						Depending on your location, you may have rights to access, correct, or delete your data. Contact us to make a request and
						we will respond as required by applicable law.
					</p>
				</section>

				<section>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Contact</h2>
					<p style={{ opacity: 0.9 }}>
						Questions about this policy? Contact the Slide Syndicate site administrators.
					</p>
				</section>

				<p style={{ marginTop: 28, opacity: 0.7 }}>© {year} Slide Syndicate</p>
			</div>
		</main>
	);
}
