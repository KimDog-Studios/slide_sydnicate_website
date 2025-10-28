import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Use • Slide Syndicate",
	description: "Rules for using Slide Syndicate websites and services.",
};

export default function TermsPage() {
	const year = new Date().getFullYear();
	return (
		<main style={{ color: "#fff" }}>
			<div style={{ maxWidth: 900, margin: "0 auto", padding: "128px 16px 48px" }}>
				<h1 style={{ fontWeight: 900, marginBottom: 8 }}>Terms of Use</h1>
				<p style={{ opacity: 0.85, marginBottom: 24 }}>Effective {new Date().toLocaleDateString()}</p>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Acceptance of terms</h2>
					<p style={{ opacity: 0.9 }}>
						By accessing or using our sites and services, you agree to these Terms. If you do not agree, do not use the services.
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Accounts and security</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>You are responsible for maintaining the confidentiality of your account and credentials.</li>
						<li>We may suspend or terminate access for policy violations, abuse, or security concerns.</li>
						<li>We may update, change, or discontinue features at any time.</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Memberships and billing</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>Memberships grant access to specific benefits indicated at purchase.</li>
						<li>Billing occurs via supported payment processors; additional terms may apply.</li>
						<li>Chargebacks or fraud may result in immediate account restrictions.</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Gifts and codes</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>Gift codes are single-use and may expire after a posted period.</li>
						<li>A valid account and guild membership may be required to redeem benefits.</li>
						<li>We reserve the right to void codes obtained fraudulently or used in violation of these Terms.</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Acceptable use</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>No unlawful, abusive, or disruptive behavior.</li>
						<li>No attempts to bypass security or abuse role assignment systems.</li>
						<li>No infringement of others’ rights or violation of platform policies (e.g., Discord).</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Disclaimers and liability</h2>
					<p style={{ opacity: 0.9 }}>
						Services are provided “as is” without warranties of any kind. To the fullest extent permitted by law, we are not liable for
						indirect, incidental, or consequential damages arising from the use of the services.
					</p>
				</section>

				<section>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Changes to these Terms</h2>
					<p style={{ opacity: 0.9 }}>
						We may update these Terms from time to time. Continued use after changes constitutes acceptance of the updated Terms.
					</p>
				</section>

				<p style={{ marginTop: 28, opacity: 0.7 }}>© {year} Slide Syndicate</p>
			</div>
		</main>
	);
}
