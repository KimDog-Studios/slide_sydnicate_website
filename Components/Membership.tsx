import React, { useState, useEffect, useCallback } from "react";
import {
	Box,
	Card,
	CardHeader,
	CardContent,
	Typography,
	Button,
	Chip,
	Stack,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Fade,
	Snackbar,
	Alert,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Divider,
	IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PaymentIcon from "@mui/icons-material/Payment";

// Use minLevel to control when a feature unlocks
const featureCatalog = [
	{ key: "access", label: "Access to 50+ public servers", minLevel: 0 },
	{ key: "updates", label: "Monthly public car updates", minLevel: 0 },
	{ key: "support", label: "Help & FAQ support", minLevel: 0 },
	{ key: "badges", label: "In-game badges", minLevel: 0 },
	{ key: "early", label: "Early Access to Cars & Maps", minLevel: 2 },
	{ key: "carDev", label: "Early Car Development", minLevel: 2 },
	{ key: "support_2", label: "Get Faster Support Responses", minLevel: 2 },
	{ key: "roles", label: "Custom In Game Tags", minLevel: 1 },
	{ key: "reserved", label: "Get Access To Reserved Car Slots", minLevel: 3 },
	{ key: "community", label: "Community Voting Access", minLevel: 3 },
	{ key: "complete", label: "Complete Server Access", minLevel: 3 },
	{ key: "previous", label: "All previous tier benefits", minLevel: 1 },
];
// Alphabetically sorted view of features by label
const sortedFeatureCatalog = [...featureCatalog].sort((a, b) => {
	if (a.key === "previous" && b.key !== "previous") return -1;
	if (b.key === "previous" && a.key !== "previous") return 1;
	return a.label.localeCompare(b.label);
});

type FeatureKey = (typeof featureCatalog)[number]["key"];
type FeatureStateMap = Record<FeatureKey, boolean>;
type FeatureNotesMap = Partial<Record<FeatureKey, string>>;
type TierActionVariant = "muted" | "primary" | "outline" | "accent";

interface Tier {
	level: number;
	badge: string;
	name: string;
	price: { amount: string; cadence?: string };
	action: { label: string; emphasis: TierActionVariant };
	highlight: boolean;
	featureStates: FeatureStateMap;
	featureNotes?: FeatureNotesMap;
	// Added: pricing fields
	monthlyPrice: number; // base monthly price in USD
	annualDiscountPct: number; // percent off for annual billing (0-100)
}

const defaultFeatureStates: FeatureStateMap = featureCatalog.reduce<FeatureStateMap>(
	(acc, feature) => {
		acc[feature.key] = false;
		return acc;
	},
	{} as FeatureStateMap
);

export const tiers: Tier[] = [
	{
		level: 0,
		badge: "BEGINNER",
		name: "Beginner Access",
		price: { amount: "Free", cadence: "" },
		action: { label: "Current Plan", emphasis: "muted" },
		highlight: false,
		featureStates: {},
		featureNotes: {
			customPresets: "Custom server presets (upgrade required)",
		},
		// Added pricing details
		monthlyPrice: 0,
		annualDiscountPct: 0,
	},
	{
		level: 1,
		badge: "STREET",
		name: "Streetline",
		price: { amount: "$1.99", cadence: "month" },
		action: { label: "Subscribe", emphasis: "primary" },
		highlight: false,
		featureStates: {},
		featureNotes: {
			customPresets: "1 preset in custom servers",
		},
		// Added pricing details
		monthlyPrice: 1.99,
		annualDiscountPct: 20,
	},
	{
		level: 2,
		badge: "TANDEM",
		name: "Tandem Club",
		price: { amount: "$4.99", cadence: "month" },
		action: { label: "Free 7-day trial", emphasis: "outline" },
		highlight: true,
		featureStates: {},
		featureNotes: {
			customPresets: "5 presets in custom servers",
		},
		// Added pricing details
		monthlyPrice: 4.99,
		annualDiscountPct: 20,
	},
	{
		level: 3,
		badge: "PRO LINE",
		name: "Pro Line",
		// keep label consistent with Stripe: $9.99 USD
		price: { amount: "$9.99", cadence: "month" },
		action: { label: "Subscribe", emphasis: "accent" },
		highlight: false,
		featureStates: {},
		featureNotes: {
			customPresets: "Custom server presets included",
			tenPresets: "10 presets in custom servers",
			allCars: "All cars in custom servers",
		},
		// pricing now matches Stripe: 9.99 USD monthly
		monthlyPrice: 9.99,
		annualDiscountPct: 20,
	},
];

// Helpers for pricing display
type CurrencyCode =
	| "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "NZD" | "CHF" | "SEK" | "NOK"
	| "DKK" | "INR" | "BRL" | "ZAR" | "MXN" | "PLN" | "CZK" | "HUF" | "TRY" | "SGD"
	| "HKD" | "KRW" | "CNY";
// Minimal static fallback rates (base USD) used if network fails; will be overridden by live rates.
const fallbackRates: Record<CurrencyCode, number> = {
	USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.55, JPY: 156, NZD: 1.68, CHF: 0.90,
	SEK: 10.9, NOK: 11.0, DKK: 6.86, INR: 83.2, BRL: 5.6, ZAR: 18.5, MXN: 18.0,
	PLN: 4.0, CZK: 23.4, HUF: 363, TRY: 34.5, SGD: 1.35, HKD: 7.8, KRW: 1350, CNY: 7.25,
};
const formatCurrency = (value: number, currency: CurrencyCode) =>
	new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
const calcAnnualTotal = (monthlyPrice: number, discountPct: number) =>
	monthlyPrice * 12 * (1 - discountPct / 100);
const getPriceParts = (
	tier: Tier,
	billing: "monthly" | "annually",
	currency: CurrencyCode,
	rates: Record<string, number>
): { main: string; cadence: string; sub?: string; savePct?: number } => {
	if (tier.monthlyPrice === 0) {
		return { main: "Free", cadence: "" };
	}
	const rate = rates[currency] ?? fallbackRates[currency] ?? 1;
	const monthlyInCurrency = tier.monthlyPrice * rate;
	if (billing === "monthly") {
		return { main: formatCurrency(monthlyInCurrency, currency), cadence: "/mo" };
	}
	const total = calcAnnualTotal(monthlyInCurrency, tier.annualDiscountPct);
	const perMo = total / 12;
	return {
		main: formatCurrency(total, currency),
		cadence: "/yr",
		sub: `${formatCurrency(perMo, currency)}/mo avg`,
		savePct: tier.annualDiscountPct > 0 ? tier.annualDiscountPct : undefined,
	};
};

function Membership() {
	const [billing, setBilling] = useState<"monthly" | "annually">("monthly");
	const [currency, setCurrency] = useState<CurrencyCode>("USD");
	const [fxRates, setFxRates] = useState<Record<string, number>>(fallbackRates);
	const [toast, setToast] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({
		open: false,
		msg: "",
		sev: "success",
	});
	const [me, setMe] = useState<{ id: string } | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const FX_CACHE_KEY = "fx:USD:exchangerate.host";
	const FX_TTL_MS = 12 * 60 * 60 * 1000; // 12h
	const [giftOpenForLevel, setGiftOpenForLevel] = useState<number | null>(null);
	const [giftRecipientId, setGiftRecipientId] = useState<string>("");
	const [giftBusy, setGiftBusy] = useState(false);
	const [giftCode, setGiftCode] = useState<string>("");
	const [subLevel, setSubLevel] = useState<number | null>(null);
	const [subscribedLevels, setSubscribedLevels] = useState<number[]>([]);

	// Checkout modal state
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [checkoutLevel, setCheckoutLevel] = useState<number | null>(null);

	// Coming soon modal
	const [comingSoonOpen, setComingSoonOpen] = useState(false);

	// Open / close helpers for the checkout confirmation modal
	const openCheckout = (level: number) => {
		setCheckoutLevel(level);
		setCheckoutOpen(true);
	};
	const closeCheckout = () => {
		setCheckoutOpen(false);
		setCheckoutLevel(null);
	};

	const closeToast = () => setToast((t) => ({ ...t, open: false }));

	// Detect a sensible default currency from the browser locale
	React.useEffect(() => {
		// Force USD because Stripe prices are configured only in USD
		setCurrency("USD");
	}, []);

	// Load live FX rates with caching (exchangerate.host, base USD)
	React.useEffect(() => {
		const loadRates = async () => {
			try {
				const cachedRaw = localStorage.getItem(FX_CACHE_KEY);
				if (cachedRaw) {
					const cached = JSON.parse(cachedRaw) as { ts: number; rates: Record<string, number> };
					if (Date.now() - cached.ts < FX_TTL_MS) {
						setFxRates({ ...fallbackRates, ...cached.rates });
						return;
					}
				}
			} catch { /* ignore cache parse */ }
			try {
				const res = await fetch("https://api.exchangerate.host/latest?base=USD");
				if (!res.ok) throw new Error("rate fetch failed");
				const data = await res.json();
				const rates = (data?.rates ?? {}) as Record<string, number>;
				const merged = { ...fallbackRates, ...rates };
				setFxRates(merged);
				try {
					localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ts: Date.now(), rates }));
				} catch { /* ignore cache write */ }
			} catch {
				// keep fallback rates
				setFxRates((r) => ({ ...fallbackRates, ...r }));
			}
		};
		loadRates();
	}, []);

	// Tier column colors
	const tierAccent = (level: number) =>
		level === 3 ? "rgba(255,61,110,0.9)" : level === 2 ? "rgba(168,85,247,0.9)" : level === 1 ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.28)";
	const tierBg = (level: number) =>
		level === 3 ? "rgba(255,61,110,0.08)" : level === 2 ? "rgba(168,85,247,0.08)" : level === 1 ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)";

	// Use the same outline and gradients as the tier cards
	const tierOutline = (level: number) =>
		level === 3
			? "rgba(255,61,110,0.7)"
			: level === 2
			? "rgba(168,85,247,0.6)"
			: level === 1
			? "rgba(59,130,246,0.6)"
			: "rgba(255,255,255,0.16)";
	const tierCardGradient = (level: number) =>
		level === 3
			? "linear-gradient(180deg, rgba(255,61,110,0.28), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(255,61,110,0.35), transparent)"
			: level === 2
			? "linear-gradient(180deg, rgba(168,85,247,0.22), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(245,158,11,0.25), transparent)"
			: level === 1
			? "linear-gradient(180deg, rgba(59,130,246,0.22), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(20,184,166,0.25), transparent)"
			: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7))";

	// Taglines per tier (by level)
	const tierTaglines = [
		"Jump in and warm up.",        // Tier 0 (Paddock Access)
		"Dial in your first tunes.",   // Tier 1 (Streetline)
		"Chase and lead with confidence.", // Tier 2 (Tandem Club)
		"Full-send, competition ready.",   // Tier 3 (Pro Line)
	];

	// Stable admin role id from env
	const adminRoleIdRef = React.useRef<string>(
		(process.env.NEXT_PUBLIC_DISCORD_ADMIN_ROLE_ID || process.env.DISCORD_ADMIN_ROLE_ID || "").trim()
	);

	// Apply Discord membership snapshot (merge levels and detect admin)
	const applyMembershipSnapshot = React.useCallback((snap: any) => {
		if (!snap) return;
		try {
			// Merge levels
			const lvls: number[] = Array.isArray(snap.levels)
				? snap.levels.map((n: any) => Number(n)).filter((n: unknown) => !Number.isNaN(n))
				: [];
			if (lvls.length) {
				setSubscribedLevels((prev) => Array.from(new Set([...(prev || []), ...lvls])));
			}
			// Admin from roles
			const rolesRaw: unknown = snap.roles ?? snap.roleIds ?? snap.role_ids;
			if (Array.isArray(rolesRaw)) {
				const roles = rolesRaw.map((x: any) => String(x));
				if (adminRoleIdRef.current && roles.includes(adminRoleIdRef.current)) {
					setIsAdmin(true);
				}
			}
		} catch {}
	}, []);

	// Re-fetch subscription/membership info from the server/Discord and update local state.
	// Used after admin grants or other actions to refresh UI immediately.
	const refreshMembershipFromDiscord = useCallback(async () => {
		try {
			// Get current subscription status (levels + roles)
			const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
			if (r.ok) {
				const d = await r.json().catch(() => null);
				if (Array.isArray(d?.levels)) {
					const lvls = d.levels.map((n: any) => Number(n)).filter((n: any) => !Number.isNaN(n));
					setSubscribedLevels(lvls);
				}
				// Admin from roles if configured
				const rolesRaw: unknown = d?.roles ?? d?.roleIds ?? d?.role_ids;
				if (Array.isArray(rolesRaw)) {
					const roles = rolesRaw.map((x: any) => String(x));
					if (adminRoleIdRef.current && roles.includes(adminRoleIdRef.current)) {
						setIsAdmin(true);
					}
				}
			}
		} catch {
			// ignore and continue
		}

		// Also pull a Discord snapshot (if server exposes it) and apply membership snapshot merging logic
		try {
			const m = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
			const mj = m.ok ? await m.json().catch(() => null) : null;
			if (mj) applyMembershipSnapshot(mj);
		} catch {
			// ignore
		}
	}, [applyMembershipSnapshot]);

	// Fetch session data on mount
	useEffect(() => {
		(async () => {
			try {
				const r = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
				if (!r.ok) return;
				const d = await r.json();
				if (d?.authenticated && d?.user?.id) setMe({ id: String(d.user.id) });
			} catch {}
		})();
	}, []);

	// Role-based admin check
	useEffect(() => {
		(async () => {
			try {
				const r = await fetch("/api/auth/is-admin", { credentials: "include", cache: "no-store" });
				const d = await r.json().catch(() => null);
				setIsAdmin(!!d?.isAdmin);
			} catch {
				setIsAdmin(false);
			}
		})();
	}, []);

	// Public admin fallback: if the current user matches NEXT_PUBLIC_ADMIN_DISCORD_ID, treat as admin
	useEffect(() => {
		try {
			const pubAdmin = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID || "").trim();
			if (pubAdmin && me?.id && String(me.id) === pubAdmin) {
				setIsAdmin(true);
			}
		} catch {
			/* ignore */
		}
	}, [me]);

	// Fetch which tier roles the user already has
	useEffect(() => {
		(async () => {
			try {
				const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
				if (r.ok) {
					const d = await r.json().catch(() => null);
					if (Array.isArray(d?.levels)) {
						const lvls = d.levels.map((n: any) => Number(n)).filter((n: any) => !Number.isNaN(n));
						setSubscribedLevels(lvls);
					}
					// Admin from roles if configured
					const rolesRaw: unknown = d?.roles ?? d?.roleIds ?? d?.role_ids;
					if (Array.isArray(rolesRaw)) {
						const roles = rolesRaw.map((x: any) => String(x));
						if (adminRoleIdRef.current && roles.includes(adminRoleIdRef.current)) {
							setIsAdmin(true);
						}
					}
				}
			} catch {
				setSubscribedLevels([]);
			}
			// Also pull Discord snapshot to merge any newer state
			try {
				const m = await fetch("/api/discord/grant-role", { credentials: "include", cache: "no-store" });
				const mj = m.ok ? await m.json() : null;
				if (mj) applyMembershipSnapshot(mj);
			} catch {}
		})();
	}, [applyMembershipSnapshot]);

	// Start checkout for a tier and redirect to payment page
	const createCheckout = async (level: number, opts?: { billing?: "monthly" | "annually"; currency?: CurrencyCode }) => {
		const billingChoice = opts?.billing ?? billing;
		const currencyChoice = opts?.currency ?? currency;
		try {
			setSubLevel(level);
			const res = await fetch("/api/checkout/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ level, billing: billingChoice, currency: currencyChoice }),
			});
			const j = await res.json().catch(() => null);
			const url: string | undefined = j?.url || j?.checkoutUrl;
			if (url) {
				// redirect to Stripe (or provided) checkout
				window.location.href = url;
				return;
			}
			// Fallback: client-side route if API didn’t return a URL — include billing & currency
			window.location.href = `/checkout?level=${encodeURIComponent(level)}&billing=${encodeURIComponent(billingChoice)}&currency=${encodeURIComponent(currencyChoice)}`;
		} catch (err: any) {
			// If Stripe returns "No such price" we surface a clearer message for site admins
			const rawMsg = String(err?.message || err || "Checkout failed");
			if (rawMsg.includes("No such price") || rawMsg.includes("No such Price")) {
				console.error("Stripe price error during checkout:", err);
				setToast({
					open: true,
					msg: "Payment configuration error: missing Stripe price for the selected plan. Contact site admin to fix price mapping.",
					sev: "error",
				});
			} else {
				setToast({ open: true, msg: rawMsg, sev: "error" });
			}
			setSubLevel(null);
		}
	};

	// Called from the modal confirm button
	const doCheckout = async () => {
		if (!checkoutLevel) return;
		// Close UI quickly — createCheckout will navigate away on success
		closeCheckout();
		await createCheckout(checkoutLevel, { billing, currency });
	};

	// Gift handlers
	const openGift = (level: number) => {
		// Admin-only gift feature
		if (!isAdmin) {
			setToast({ open: true, msg: "Admins only", sev: "error" });
			return;
		}
		setGiftOpenForLevel(level);
		setGiftRecipientId(me?.id || "");
		setGiftBusy(false);
		setGiftCode("");
	};
	const closeGift = () => {
		setGiftOpenForLevel(null);
		setGiftRecipientId("");
		setGiftBusy(false);
		setGiftCode("");
	};

	const doGift = async () => {
		if (!giftOpenForLevel) return;
		if (!isAdmin) {
			setToast({ open: true, msg: "Admins only", sev: "error" });
			return;
		}
		const level = giftOpenForLevel;
		const targetUserId = (giftRecipientId || "").trim();
		if (!targetUserId) {
			setToast({ open: true, msg: "Enter a Discord user ID", sev: "error" });
			return;
		}
		try {
			setGiftBusy(true);
			const res = await fetch("/api/admin/grant-role", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetUserId, level }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error || "Grant failed");
			setToast({ open: true, msg: `Granted tier ${level} to ${targetUserId}`, sev: "success" });
			await refreshMembershipFromDiscord();
			closeGift();
		} catch (e: any) {
			setToast({ open: true, msg: e?.message || "Gift error", sev: "error" });
		} finally {
			setGiftBusy(false);
		}
	};

	const copyGiftCode = async () => {
		if (!giftCode) return;
		try {
			await navigator.clipboard.writeText(giftCode);
			setToast({ open: true, msg: "Gift code copied", sev: "success" });
		} catch {
			setToast({ open: true, msg: "Copy failed", sev: "error" });
		}
	};

	// Optional display formatter if you later want to prettify the raw code.
	// For now we show the exact code returned by the API.

	return (
		<section className="py-12 text-gray-100">
			<Box className="max-w-7xl mx-auto px-4">
				<Stack alignItems="center" spacing={1} className="mb-6">
					<Typography variant="h4" fontWeight={800} textAlign="center" color="inherit">
						Enhance your experience with VIP
					</Typography>
					<Box
						sx={{
							position: "relative",
							display: "inline-flex",
							gap: 0.5,
							p: 0.5,
							borderRadius: 9999,
							bgcolor: "rgba(255,255,255,0.06)",
							border: "1px solid rgba(255,255,255,0.12)",
							mt: 3, // push the toggle down so the badge doesn't overlap the heading
						}}
					>
						<Button
							size="small"
							disableElevation
							onClick={() => setBilling("monthly")}
							variant={billing === "monthly" ? "contained" : "text"}
							sx={{
								borderRadius: 9999,
								px: 2.5,
								color: billing === "monthly" ? "#0b0b0b" : "#E5E7EB",
								bgcolor: billing === "monthly" ? "#FFFFFF" : "transparent",
								"&:hover": { bgcolor: billing === "monthly" ? "#F5F5F5" : "rgba(255,255,255,0.08)" },
							}}
						>
							Monthly
						</Button>
						<Button
							size="small"
							disableElevation
							onClick={() => setBilling("annually")}
							variant={billing === "annually" ? "contained" : "text"}
							sx={{
								borderRadius: 9999,
								px: 2.5,
								color: billing === "annually" ? "#0b0b0b" : "#E5E7EB",
								bgcolor: billing === "annually" ? "#FFFFFF" : "transparent",
								"&:hover": { bgcolor: billing === "annually" ? "#F5F5F5" : "rgba(255,255,255,0.08)" },
							}}
						>
							Annually
						</Button>
						<Box
							sx={{
								position: "absolute",
								right: 6,
								top: -8, // lower the badge so it doesn't sit in the title area
								fontSize: 11,
								px: 1,
								py: 0.25,
								borderRadius: 9999,
								bgcolor: "#22c55e",
								color: "#052e16",
								fontWeight: 800,
								letterSpacing: 0.2,
								boxShadow: "0 6px 14px rgba(34,197,94,0.35)",
							}}
						>
							Save up to 40%
						</Box>
					</Box>
					<Button href="#compare" variant="text" color="inherit">
						Can&apos;t choose? Compare plans
					</Button>
				</Stack>

				<Grid container spacing={3}>
					{tiers.map((tier) => {
						const price = getPriceParts(tier, billing, currency, fxRates);
						const isSubscribedTier = tier.level > 0 && subscribedLevels.includes(tier.level);
						const outlineColor =
							tier.level === 3
								? "rgba(255,61,110,0.7)"
								: tier.level === 2
								? "rgba(168,85,247,0.6)"
								: tier.level === 1
								? "rgba(59,130,246,0.6)"
								: "rgba(255,255,255,0.16)";
						const cardGradient =
							tier.level === 3
								? "linear-gradient(180deg, rgba(255,61,110,0.28), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(255,61,110,0.35), transparent)"
								: tier.level === 2
								? "linear-gradient(180deg, rgba(168,85,247,0.22), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(245,158,11,0.25), transparent)"
								: tier.level === 1
								? "linear-gradient(180deg, rgba(59,130,246,0.22), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(20,184,166,0.25), transparent)"
								: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7))";
						return (
							<Grid key={tier.level}>
								<Box sx={{ position: "relative" }}>
									{tier.highlight && (
										<Box
											sx={{
												position: "absolute",
												top: -18,
												right: -32,
												px: 6,
												py: 0.9,
												transform: "rotate(12deg)",
												borderRadius: 9999,
												background: "linear-gradient(90deg, rgba(255,61,110,1), rgba(255,140,66,1))",
												color: "#ffffff",
												fontWeight: 900,
												fontSize: 13,
												letterSpacing: 1,
												textShadow: "0 2px 6px rgba(0,0,0,0.35)",
												boxShadow: "0 14px 28px rgba(255,61,110,0.35)",
												border: "1px solid rgba(255,255,255,0.35)",
												zIndex: 2,
												pointerEvents: "none",
											}}
										>
											MOST POPULAR
										</Box>
									)}
									<Card
										elevation={tier.highlight ? 8 : 2}
										sx={{
											position: "relative",
											overflow: "hidden",
											color: "#ffffff",
											borderRadius: 2,
											border: "1px solid",
											borderColor: outlineColor,
											backgroundColor: "#0b0b0b",
											// distinct gradients per tier over solid black
											backgroundImage: cardGradient,
											backgroundRepeat: "no-repeat",
											backgroundSize: "cover",
											backgroundBlendMode: "overlay",
											boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
											transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
											"&:hover": {
												transform: "translateY(-4px)",
												boxShadow: "0 18px 44px rgba(0,0,0,0.6)",
												borderColor:
													tier.level === 3
														? "rgba(255,61,110,0.85)"
														: tier.level === 2
														? "rgba(168,85,247,0.85)"
														: tier.level === 1
														? "rgba(59,130,246,0.85)"
														: "rgba(255,255,255,0.24)",
											},
										}}
									>
										<CardHeader
											sx={{
												px: 2.5,
												py: 2,
												borderBottom: "1px solid rgba(255,255,255,0.06)",
											}}
											title={
												<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
													<Chip
														size="small"
														label={tier.badge}
														variant="outlined"
														sx={{
															color: "#ffffff",
															borderColor: outlineColor,
															backgroundImage: cardGradient,
															backgroundColor: "transparent",
															backgroundRepeat: "no-repeat",
															backgroundSize: "200% 200%",
															backdropFilter: "blur(2px)",
														}}
													/>
													<Typography variant="h6" fontWeight={700} color="inherit">
														{tier.name}
													</Typography>
												</Stack>
											}
											subheader={
												<Fade in key={`${billing}-${tier.level}`} timeout={250}>
													<Box>
														<Typography variant="h5" fontWeight={900} sx={{ color: "#ffffff" }}>
															<span style={{ whiteSpace: "nowrap" }}>
																{price.main}
																{price.cadence && <span style={{ marginLeft: 4 }}>{price.cadence}</span>}
															</span>
															{price.cadence && (
																<span
																	title="Stripe"
																	style={{
																		display: "inline-flex",
																		alignItems: "center",
																		gap: 4,
																		background: "#635bff",
																		color: "#fff",
																		borderRadius: 9999,
																		padding: "2px 8px",
																		fontSize: 10,
																		fontWeight: 900,
																		boxShadow: "0 0 10px rgba(99,91,255,0.35)",
																		marginLeft: 8,
																		verticalAlign: "middle",
																	}}
																>
																	<PaymentIcon fontSize="inherit" />
																	Stripe
																</span>
															)}
														</Typography>
														{price.sub && (
															<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>
																{price.sub}
															</Typography>
														)}
													</Box>
												</Fade>
											}
										/>

										<CardContent sx={{ px: 2.5, py: 2 }}>
											<Stack spacing={1.5}>
												{/* Primary: Subscribe/Subscribed */}
												<Button
													fullWidth
													variant="contained"
													disableElevation
													sx={{
														textTransform: "uppercase",
														fontWeight: 800,
														letterSpacing: 0.4,
														borderRadius: 9999,
														py: 1,
														bgcolor: "#ffffff",
														color: "#0b0b0b",
														"&:hover": { bgcolor: "#f5f5f5" },
														// keep same colors even when disabled
														"&.Mui-disabled": { bgcolor: "#ffffff", color: "#0b0b0b", opacity: 1, cursor: "default" },
														...(tier.level === 0 ? { pointerEvents: "none", opacity: 0.6 } : {}),
													}}
													onClick={() => setComingSoonOpen(true)}
													disabled={tier.level === 0 || subLevel === tier.level || isSubscribedTier}
												>
													{subLevel === tier.level ? (
														<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
															<CircularProgress size={16} color="inherit" />
															Redirecting...
														</span>
													) : isSubscribedTier ? "Subscribed" : "Subscribe"}
												</Button>

												{/* Secondary: Send as a Gift (admin only) */}
												{isAdmin && tier.level > 0 && (
													<Button
														variant="text"
														size="small"
														startIcon={<CardGiftcardIcon fontSize="small" />}
														sx={{
															alignSelf: "flex-start",
															color: "#ffffff",
															textDecoration: "underline",
															textUnderlineOffset: "4px",
															px: 0,
															"&:hover": { bgcolor: "transparent", color: "#E5E7EB" },
														}}
														onClick={() => openGift(tier.level)}
													>
														Send as a Gift
													</Button>
												)}

												<List dense className="space-y-0">
													{sortedFeatureCatalog
														.filter((feature) =>
															feature.key === "previous"
																? tier.level >= feature.minLevel
																: feature.minLevel === tier.level
														)
														.map((feature) => {
															const label = tier.featureNotes?.[feature.key] ?? feature.label;
															return (
																<ListItem key={feature.key} disableGutters sx={{ py: 0.5, "&:not(:first-of-type)": { borderTop: "1px solid rgba(255,255,255,0.06)" } }}>
																	<ListItemIcon sx={{ minWidth: 28 }}>
																		<CheckCircleOutlineIcon sx={{ color: "#ffffff" }} fontSize="small" />
																	</ListItemIcon>
																	<ListItemText primaryTypographyProps={{ variant: "body2", sx: { color: "#ffffff" } }} primary={label} />
																</ListItem>
															);
														})}
												</List>
											</Stack>
										</CardContent>
									</Card>
								</Box>
							</Grid>
						);
					})}
				</Grid>

				{/* Compare table */}
				<Box id="compare" sx={{ mt: 8, overflowX: "auto" }}>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "minmax(220px,1fr) repeat(4, minmax(160px, 1fr))",
							bgcolor: "#000",
							borderRadius: 2,
							overflow: "hidden",
							border: "1px solid",
							borderColor: "#8b5cf6", // purple outline
							boxShadow: "0 0 0 3px rgba(139,92,246,0.15)",
							borderTop: "1px solid rgba(255,255,255,0.06)",
							borderLeft: "1px solid rgba(255,255,255,0.06)",
							"& > *": {
								borderRight: "1px solid rgba(255,255,255,0.06)",
								borderBottom: "1px solid rgba(255,255,255,0.06)",
							},
						}}
					>
						{/* Header row */}
						<Box sx={{ p: 2, bgcolor: "rgba(255,255,255,0.03)", fontWeight: 700, color: "#fff" }}>
							COMPARE
						</Box>
						{tiers.map((t) => {
							const p = getPriceParts(t, billing, currency, fxRates);
							const isSubscribedTier = t.level > 0 && subscribedLevels.includes(t.level);
							return (
								<Box key={`hdr-${t.level}`} sx={{ p: 2, textAlign: "center", bgcolor: tierBg(t.level), borderTop: `3px solid ${tierAccent(t.level)}` }}>
									<Stack spacing={1} alignItems="center">
										<Chip
											size="small"
											label={`TIER ${t.level}`}
											variant="outlined"
											sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)" }}
										/>
										<Typography variant="subtitle2" sx={{ color: "#fff", opacity: 0.9 }}>
											{t.name}
										</Typography>
										<Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1, display: "flex", alignItems: "center", gap: 6 }}>
											<span style={{ whiteSpace: "nowrap" }}>
												{p.main}
												{p.cadence && <span style={{ marginLeft: 4 }}>{p.cadence}</span>}
											</span>
											{p.cadence && (
												<span
													title="Stripe"
													style={{
														display: "inline-flex",
														alignItems: "center",
														gap: 4,
														background: "#635bff",
														color: "#fff",
														borderRadius: 9999,
														padding: "1px 6px",
														fontSize: 9,
														fontWeight: 900,
														boxShadow: "0 0 10px rgba(99,91,255,0.35)",
														marginLeft: 8,
														verticalAlign: "middle",
													}}
												>
													<PaymentIcon fontSize="inherit" />
													Stripe
												</span>
											)}
										</Typography>
										<Typography
											variant="caption"
											sx={{ color: "#fff", opacity: 0.85, mt: 0.5, display: "block" }}
										>
											{tierTaglines[t.level]}
										</Typography>
										{t.level > 0 ? (
											<Stack direction="row" spacing={1}>
												<Button
													size="small"
													variant="contained"
													disableElevation
													onClick={() => setComingSoonOpen(true)}
													sx={{
														bgcolor: "#fff",
														color: "#0b0b0b",
														borderRadius: 9999,
														px: 2.5,
														py: 0.75,
														"&:hover": { bgcolor: "#f5f5f5" },
														"&.Mui-disabled": { bgcolor: "#ffffff", color: "#0b0b0b", opacity: 1, cursor: "default" },
													}}
													disabled={subLevel === t.level || isSubscribedTier}
												>
													{subLevel === t.level ? "Redirecting..." : (isSubscribedTier ? "Subscribed" : "Subscribe")}
												</Button>

												{/* Gift (admin only) */}
												{isAdmin && (
													<Button
														size="small"
														variant="outlined"
														startIcon={<CardGiftcardIcon fontSize="small" />}
														onClick={() => openGift(t.level)}
														sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)" }}
													>
														Gift
													</Button>
												)}
											</Stack>
										) : (
											<Button size="small" variant="contained" disableElevation disabled sx={{ bgcolor: "#fff", color: "#0b0b0b", borderRadius: 9999, px: 2.5, py: 0.75, opacity: 0.6 }}>
												Free Tier
											</Button>
										)}
									</Stack>
								</Box>
							);
						})}

						{/* Sections + rows */}
						{compareSections.map((section) => (
							<React.Fragment key={section.title}>
								{/* Section title row spans all columns */}
								<Box
									sx={{
										gridColumn: "1 / -1",
										px: 2,
										py: 1.5,
										bgcolor: "rgba(255,255,255,0.02)",
										fontWeight: 700,
										color: "#fff",
									}}
								>
									{section.title}
								</Box>

								{/* Taglines row just under the Features header */}
								{section.title === "Features" && (
									<>
										<Box sx={{ p: 2, color: "#fff", opacity: 0.9 }}>Overview</Box>
										{tiers.map((t) => (
											<Box
												key={`feat-tag-${t.level}`}
												sx={{ p: 2, textAlign: "center", bgcolor: tierBg(t.level) }}
											>
												<Typography variant="caption" sx={{ color: "#fff", opacity: 0.85 }}>
													{tierTaglines[t.level]}
												</Typography>
											</Box>
										))}
									</>
								)}

								{/* Rows */}
								{section.rows.map((row: { label: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; type: string; key: string; values: any[]; }, idx: any) => {
									return (
										<React.Fragment key={`${section.title}-${idx}`}>
											{/* Label cell */}
											<Box sx={{ p: 2, color: "#fff", opacity: 0.9 }}>{row.label}</Box>

											{/* Value cells per tier with per-column tint */}
											{tiers.map((t) => {
												let content: React.ReactNode = null;

												if (row.type === "feature") {
													// find feature's minLevel
													const f = featureCatalog.find((ff) => ff.key === row.key);
													const active = f ? t.level >= (f.minLevel ?? 99) : false;
													content = active ? (
														<CheckCircleOutlineIcon sx={{ color: "#fff" }} fontSize="small" />
													) : (
														<HighlightOffOutlinedIcon sx={{ color: "#fff", opacity: 0.6 }} fontSize="small" />
													);
												} else if (row.type === "bool") {
													const v = row.values[t.level] === true;
													content = v ? (
														<CheckCircleOutlineIcon sx={{ color: "#fff" }} fontSize="small" />
													) : (
														<HighlightOffOutlinedIcon sx={{ color: "#fff", opacity: 0.6 }} fontSize="small" />
													);
												} else if (row.type === "text" || row.type === "number") {
													const v = row.values[t.level];
													content = (
														<Typography variant="body2" sx={{ color: "#fff" }}>
															{String(v)}
														</Typography>
													);
												}

												return (
													<Box key={`${section.title}-${idx}-t${t.level}`} sx={{ p: 2, textAlign: "center", bgcolor: tierBg(t.level) }}>
														{content}
													</Box>
												);
											})}
										</React.Fragment>
									);
								})}
							</React.Fragment>
						))}
					</Box>
				</Box>
				{/* end compare table */}
				{/* Checkout Modal */}
				<Dialog open={checkoutOpen} onClose={closeCheckout} fullWidth maxWidth="sm">
					<DialogTitle sx={{ fontWeight: 900 }}>Confirm Subscription</DialogTitle>
					<DialogContent dividers>
						{checkoutLevel !== null && (
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
									{tiers.find((t) => t.level === checkoutLevel)?.name}
								</Typography>
								<Typography variant="body2" sx={{ mb: 1 }}>
									Billing: <strong>{billing}</strong> • Currency: <strong>{currency}</strong>
								</Typography>
								<Box sx={{ mb: 2 }}>
									{(() => {
										const t = tiers.find((x) => x.level === checkoutLevel)!;
										const p = getPriceParts(t, billing, currency, fxRates);
										return (
											<>
												<Typography variant="h6" sx={{ fontWeight: 900 }}>
													{p.main} {p.cadence}
												</Typography>
												{p.sub && <Typography variant="caption">{p.sub}</Typography>}
												{p.savePct && <Typography variant="caption" sx={{ display: "block" }}>Save {p.savePct}% with annual billing</Typography>}
											</>
										);
									})()}
								</Box>
								<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
									You will be redirected to our payment provider to complete the subscription.
								</Typography>
							</Box>
						)}
					</DialogContent>
					<DialogActions sx={{ px: 2, py: 1.25 }}>
						<Button onClick={closeCheckout} color="inherit" disabled={subLevel !== null}>Cancel</Button>
						<Button onClick={doCheckout} variant="contained" disableElevation sx={{ fontWeight: 800, bgcolor: "#ffffff", color: "#0b0b0b" }} disabled={subLevel !== null}>
							{subLevel !== null ? "Redirecting..." : "Proceed to Checkout"}
						</Button>
					</DialogActions>
				</Dialog>

				{/* Coming Soon Modal */}
				<Dialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} fullWidth maxWidth="xs">
					<DialogTitle sx={{ fontWeight: 900 }}>Coming soon</DialogTitle>
					<DialogContent dividers>
						<Typography variant="body2">
							Membership payments are coming soon. Thanks for your patience!
						</Typography>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setComingSoonOpen(false)} variant="contained" disableElevation sx={{ fontWeight: 800, bgcolor: "#ffffff", color: "#0b0b0b" }}>
							OK
						</Button>
					</DialogActions>
				</Dialog>

				{/* Admin-only Gift Modal (compact) */}
				<Dialog
					open={!!giftOpenForLevel}
					onClose={giftBusy ? undefined : closeGift}
					fullWidth
					maxWidth="sm"
				>
					<DialogTitle sx={{ fontWeight: 900 }}>
						Send as a Gift {typeof giftOpenForLevel === "number" ? `— Tier ${giftOpenForLevel}` : ""}
					</DialogTitle>
					<DialogContent dividers>
						{!isAdmin && (
							<Alert severity="error" sx={{ mb: 2 }}>
								Admins only
							</Alert>
						)}
						<TextField
							label="Recipient Discord User ID"
							value={giftRecipientId}
							onChange={(e) => setGiftRecipientId(e.target.value)}
							size="small"
							fullWidth
							InputLabelProps={{ shrink: true }}
							placeholder="e.g. 325603721243262978"
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={closeGift} disabled={giftBusy}>Close</Button>
						<Button
							onClick={doGift}
							disabled={giftBusy || !giftRecipientId.trim() || !isAdmin}
							variant="contained"
							disableElevation
							sx={{ fontWeight: 800, bgcolor: "#ffffff", color: "#0b0b0b", "&:hover": { bgcolor: "#f5f5f5" } }}
						>
							{giftBusy ? "Processing..." : "Send Gift"}
						</Button>
					</DialogActions>
				</Dialog>

				<Snackbar
					open={toast.open}
					autoHideDuration={4000}
					onClose={closeToast}
					anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				>
					<Alert onClose={closeToast} severity={toast.sev} variant="filled" sx={{ width: "100%" }}>
						{toast.msg}
					</Alert>
				</Snackbar>
			</Box>
 		</section>
 	);
 }
 
 // Compare table row model
 // Define compareSections for the compare table
 const compareSections = [
	{
		title: "Features",
		rows: sortedFeatureCatalog.map((feature) => ({
			label: feature.label,
			type: "feature",
			key: feature.key,
			values: tiers.map((tier) => tier.level >= feature.minLevel),
		})),
	},
	{
		title: "Custom Presets",
		rows: [
			{
				label: "Custom Presets",
				type: "text",
				key: "customPresets",
				values: tiers.map((tier) => tier.featureNotes?.customPresets || ""),
			},
			{
				label: "10 Presets in Custom Servers",
				type: "bool",
				key: "tenPresets",
				values: tiers.map((tier) => !!tier.featureNotes?.tenPresets),
			},
			{
				label: "All Cars in Custom Servers",
				type: "bool",
				key: "allCars",
				values: tiers.map((tier) => !!tier.featureNotes?.allCars),
			},
		],
	},
 ];

 export default Membership;