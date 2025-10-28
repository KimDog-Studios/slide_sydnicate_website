import React, { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default function Page() {
	return (
		<Suspense fallback={<div style={{ padding: 24 }}>Loading checkout…</div>}>
			<CheckoutClient />
		</Suspense>
	);
}
