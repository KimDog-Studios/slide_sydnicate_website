"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Box, Stack, Typography } from "@mui/material";

export default function CheckoutClient() {
	const sp = useSearchParams();
	const level = sp.get("level") || "";
	const billing = sp.get("billing") || "monthly";
	const currency = sp.get("currency") || "USD";

	return (
		<Box sx={{ maxWidth: 800, mx: "auto", px: 2, py: 6, color: "#e5e7eb" }}>
			<Stack spacing={2}>
				<Typography variant="h4" sx={{ fontWeight: 900 }}>Checkout</Typography>
				<Typography variant="body2" sx={{ opacity: 0.9 }}>
					Level: {level || "n/a"} • Billing: {billing} • Currency: {currency}
				</Typography>
			</Stack>
		</Box>
	);
}
