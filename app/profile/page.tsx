import React, { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function Page() {
	return (
		<Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading…</div>}>
			<ProfileClient />
		</Suspense>
	);
}
