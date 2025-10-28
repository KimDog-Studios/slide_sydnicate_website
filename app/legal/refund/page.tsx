import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Refund Policy • Slide Syndicate",
	description: "Refund policy for purchases and gift codes.",
};

export default function RefundPolicyPage() {
	const year = new Date().getFullYear();
	return (
		<main style={{ color: "#fff" }}>
			<div style={{ maxWidth: 900, margin: "0 auto", padding: "128px 16px 48px" }}>
				<h1 style={{ fontWeight: 900, marginBottom: 8 }}>Refund Policy</h1>
				<p style={{ opacity: 0.85, marginBottom: 24 }}>Effective {new Date().toLocaleDateString()}</p>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>No refunds</h2>
					<p style={{ opacity: 0.9 }}>
						We do not offer refunds for gift codes or standard purchases. All sales are final. This applies whether you
						purchased directly or received access via a gift code.
					</p>
				</section>

				<section style={{ marginBottom: 20 }}>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Subscription changes</h2>
					<p style={{ opacity: 0.9 }}>
						You may cancel a subscription at any time to prevent future billing. Your current paid period remains active until it ends.
					</p>
				</section>

				<section>
					<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Legal requirements</h2>
					<p style={{ opacity: 0.9 }}>
						If applicable law provides mandatory consumer rights or cooling-off periods, we will honor those rights in the required jurisdictions.
					</p>
				</section>

				<p style={{ marginTop: 28, opacity: 0.7 }}>© {year} Slide Syndicate</p>
			</div>
		</main>
	);
}
