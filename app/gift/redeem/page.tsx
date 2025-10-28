import React, { Suspense } from "react";
import RedeemClient from "./RedeemClient";

export default function Page() {
	return (
		<Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading…</div>}>
			<RedeemClient />
		</Suspense>
	);
}
