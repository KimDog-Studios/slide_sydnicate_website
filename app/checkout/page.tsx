"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Alert, Stack } from "@mui/material";
// import tier metadata from Membership
import { tiers } from "../../Components/Membership";

export default function CheckoutPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [level, setLevel] = useState<number | null>(null);
	const [billing, setBilling] = useState<"monthly" | "annually">("monthly");
	const [currency, setCurrency] = useState<string>("USD");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!searchParams) return;
		// level
		const l = searchParams.get("level");
		if (l) {
			const n = Number(l);
			if (!Number.isFinite(n) || Number.isNaN(n)) {
				setError("Invalid level in query.");
				setLevel(null);
			} else {
				setLevel(n);
			}
		}
		// billing
		const b = searchParams.get("billing");
		if (b === "monthly" || b === "annually") setBilling(b);
		// force USD regardless of query
		setCurrency("USD");
	}, [searchParams]);

	const tier = typeof level === "number" ? tiers.find((t) => t.level === level) : undefined;

	const proceed = async () => {
		if (level === null) {
			setError("Missing level.");
			return;
		}
		setError(null);
		setBusy(true);
		try {
			const res = await fetch("/api/checkout/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ level, billing, currency: "USD" }),
			});
			const j = await res.json().catch(() => null);
			if (!res.ok) {
				const msg = j?.error || j?.message || "Checkout creation failed";
				throw new Error(msg);
			}
			const url: string | undefined = j?.url || j?.checkoutUrl;
			if (url) {
				window.location.href = url;
				return;
			}
			// fallback local route (should rarely happen)
			router.replace(`/checkout?level=${encodeURIComponent(level)}&billing=${encodeURIComponent(billing)}&currency=USD`);
		} catch (e: any) {
			const raw = String(e?.message || e || "Checkout error");
			console.error("Checkout creation error:", e);
			if (raw.includes("No such price") || raw.includes("No such Price")) {
				setError("Payment configuration error: the server is missing a Stripe price for this plan. Contact the site admin to fix the Stripe product/price mapping.");
			} else {
				setError(raw);
			}
			setBusy(false);
		}
	};

	return (
		<Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}>
			<Typography variant="h5" sx={{ mb: 2, fontWeight: 800 }}>
				Complete your subscription
			</Typography>

			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{!tier ? (
				<Typography variant="body2" sx={{ color: "text.secondary" }}>
					Invalid or missing tier level. Check the link and try again.
				</Typography>
			) : (
				<Stack spacing={2}>
					<Box>
						<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{tier.name}</Typography>
						<Typography variant="body2" sx={{ color: "text.secondary" }}>{tier.badge}</Typography>
					</Box>

					<Box>
						<Typography variant="body2">
							Billing: <strong>{billing}</strong>
						</Typography>
						<Typography variant="body2">
							Currency: <strong>{currency}</strong>
						</Typography>
						<Typography variant="body2" sx={{ color: "text.secondary" }}>
							Display price shown here is the plan label: <strong>{tier.price.amount}{tier.price.cadence ? ` / ${tier.price.cadence}` : ""}</strong>
						</Typography>
					</Box>

					<Box sx={{ display: "flex", gap: 2 }}>
						<Button variant="contained" color="primary" onClick={proceed} disabled={busy}>
							{busy ? <><CircularProgress size={16} sx={{ mr: 1 }} /> Redirecting…</> : "Proceed to payment"}
						</Button>
						<Button variant="outlined" onClick={() => router.back()} disabled={busy}>Cancel</Button>
					</Box>

					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						You will be redirected to our payment provider to complete the subscription. If you encounter issues, contact support.
					</Typography>
				</Stack>
			)}
		</Box>
	);
}
