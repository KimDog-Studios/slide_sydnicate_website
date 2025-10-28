import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cookie Policy • Slide Syndicate",
	description: "How Slide Syndicate uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
	const year = new Date().getFullYear();
	return (
		<main style={{ color: "#fff" }}>
			<div style={{ maxWidth: 900, margin: "0 auto", padding: "128px 16px 48px" }}>
				<h1 style={{ fontWeight: 900, marginBottom: 8 }}>Cookie Policy</h1>
				<p style={{ opacity: 0.85, marginBottom: 24 }}>Effective {new Date().toLocaleDateString()}</p>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>What are cookies?</h2>
					<p style={{ opacity: 0.9 }}>
						Cookies are small text files stored on your device. They help websites remember information about your visit and improve
						features like sign-in and preferences.
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Types of cookies we use</h2>
					<ul style={{ opacity: 0.9, paddingLeft: 18 }}>
						<li>Essential cookies: required for authentication and core functionality.</li>
						<li>Preference cookies: remember choices such as language and UI settings.</li>
						<li>Analytics cookies: help us understand usage to improve the site (if enabled).</li>
					</ul>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Third-party cookies</h2>
					<p style={{ opacity: 0.9 }}>
						Some features may rely on third parties (e.g., payment processors, Discord). These providers may set their own cookies
						subject to their privacy policies.
					</p>
				</section>

				<section>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Managing cookies</h2>
					<p style={{ opacity: 0.9 }}>
						You can manage or block cookies in your browser settings. Blocking essential cookies may limit your ability to sign in
						or use key features.
					</p>
				</section>

				<p style={{ marginTop: 28, opacity: 0.7 }}>© {year} Slide Syndicate</p>
			</div>
		</main>
	);
}
