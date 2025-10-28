import React, { useState, useEffect } from "react";
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

const tiers: Tier[] = [
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
		price: { amount: "$10.99", cadence: "month" },
		action: { label: "Subscribe", emphasis: "accent" },
		highlight: false,
		featureStates: {},
		featureNotes: {
			customPresets: "Custom server presets included",
			tenPresets: "10 presets in custom servers",
			allCars: "All cars in custom servers",
		},
		// Added pricing details
		monthlyPrice: 10.99,
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

	const closeToast = () => setToast((t) => ({ ...t, open: false }));

	// Detect a sensible default currency from the browser locale
	React.useEffect(() => {
		try {
			const loc = (navigator?.language || "en-US").toLowerCase();
			if (loc.endsWith("-gb")) setCurrency("GBP");
			else if (loc.endsWith("-ca")) setCurrency("CAD");
			else if (loc.endsWith("-au")) setCurrency("AUD");
			else if (loc.endsWith("-jp")) setCurrency("JPY");
			else if (loc.endsWith("-nz")) setCurrency("NZD");
			else if (loc.endsWith("-ch")) setCurrency("CHF");
			else if (loc.endsWith("-se")) setCurrency("SEK");
			else if (loc.endsWith("-no")) setCurrency("NOK");
			else if (loc.endsWith("-dk")) setCurrency("DKK");
			else if (loc.endsWith("-in")) setCurrency("INR");
			else if (loc.endsWith("-br")) setCurrency("BRL");
			else if (loc.endsWith("-za")) setCurrency("ZAR");
			else if (loc.endsWith("-mx")) setCurrency("MXN");
			else if (loc.endsWith("-pl")) setCurrency("PLN");
			else if (loc.endsWith("-cz")) setCurrency("CZK");
			else if (loc.endsWith("-hu")) setCurrency("HUF");
			else if (loc.endsWith("-tr")) setCurrency("TRY");
			else if (loc.endsWith("-sg")) setCurrency("SGD");
			else if (loc.endsWith("-hk")) setCurrency("HKD");
			else if (loc.endsWith("-kr")) setCurrency("KRW");
			else if (loc.endsWith("-cn")) setCurrency("CNY");
			else if (/-be|-de|-es|-fr|-ie|-it|-nl|-pt|-fi|-at|-gr|-sk|-si|-lv|-lt|-ee|-lu/.test(loc)) setCurrency("EUR");
			else setCurrency("USD");
		} catch {
			setCurrency("USD");
		}
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
	const createCheckout = async (level: number) => {
		try {
			setSubLevel(level);
			const res = await fetch("/api/checkout/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ level }),
			});
			const j = await res.json().catch(() => null);
			const url: string | undefined = j?.url || j?.checkoutUrl;
			if (url) {
				window.location.href = url;
				return;
			}
			// Fallback: client-side route if API didn’t return a URL
			window.location.href = `/checkout?level=${encodeURIComponent(level)}`;
		} catch {
			setToast({ open: true, msg: "Checkout failed. Try again.", sev: "error" });
			setSubLevel(null);
		}
	};

	// Gift handlers
	const openGift = (level: number) => {
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
		const level = giftOpenForLevel;
		const targetUserId = (giftRecipientId || "").trim();
		if (!targetUserId) {
			setToast({ open: true, msg: "Enter a Discord user ID", sev: "error" });
			return;
		}
		try {
			setGiftBusy(true);
			if (isAdmin) {
				const res = await fetch("/api/admin/grant-role", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ targetUserId, level }),
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data?.error || "Grant failed");
				setToast({ open: true, msg: `Granted tier ${level} to ${targetUserId}`, sev: "success" });
				// Pull latest roles/levels so UI reflects immediately
				await refreshMembershipFromDiscord();
				closeGift();
				return;
			}
			// Non-admin: create a free gift code the recipient can redeem
			const res = await fetch("/api/gift/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetUserId, level }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data?.code) throw new Error(data?.error || "Gift creation failed");
			const code: string = String(data.code);
			setGiftCode(code);
			// Auto copy + redirect
			try {
				await navigator.clipboard.writeText(code);
				setToast({ open: true, msg: "Gift code copied. Redirecting to redeem…", sev: "success" });
			} catch {
				setToast({ open: true, msg: "Gift code ready. Could not auto-copy.", sev: "success" });
			}
			setTimeout(() => {
				window.location.href = `/gift/redeem?code=${encodeURIComponent(code)}`;
			}, 2500);
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
													onClick={() => createCheckout(tier.level)}
													disabled={tier.level === 0 || subLevel === tier.level || isSubscribedTier}
												>
													{subLevel === tier.level ? (
														<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
															<CircularProgress size={16} color="inherit" />
															Redirecting...
														</span>
													) : isSubscribedTier ? "Subscribed" : "Subscribe"}
												</Button>

												{/* Secondary: Send as a Gift (always available for paid tiers) */}
												{tier.level > 0 && (
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
													onClick={() => createCheckout(t.level)}
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

												{/* Gift always available for paid tiers */}
												<Button
													size="small"
													variant="outlined"
													startIcon={<CardGiftcardIcon fontSize="small" />}
													onClick={() => openGift(t.level)}
													sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)" }}
												>
													Gift
												</Button>
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
								{section.rows.map((row, idx) => {
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
				<Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
					<Alert onClose={closeToast} severity={toast.sev} variant="filled" sx={{ width: "100%" }}>
						{toast.msg}
					</Alert>
				</Snackbar>

				{/* Gift Modal */}
				<Dialog
					open={!!giftOpenForLevel}
					onClose={giftBusy ? undefined : closeGift}
					fullWidth
					maxWidth="sm"
					PaperProps={{
						sx: {
							position: "relative",
							overflow: "hidden",
							color: "#ffffff",
							borderRadius: 2,
							border: "1px solid",
							borderColor: typeof giftOpenForLevel === "number" ? tierOutline(giftOpenForLevel) : "rgba(255,255,255,0.16)",
							backgroundColor: "#0b0b0b",
							backgroundImage: typeof giftOpenForLevel === "number" ? tierCardGradient(giftOpenForLevel) : "none",
							backgroundRepeat: "no-repeat",
							backgroundSize: "cover",
							backgroundBlendMode: "overlay",
							boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
						},
					}}
				>
					<DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 900 }}>
						Send as a Gift
					</DialogTitle>
					<DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.06)" }}>
						{typeof giftOpenForLevel === "number" && (
							<Box sx={{ mb: 2 }}>
								{/* Header row (badge + name + FREE) */}
								<Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
									<Chip
										size="small"
										label={tiers.find(t => t.level === giftOpenForLevel)?.badge}
										variant="outlined"
										sx={{
											color: "#ffffff",
											borderColor: tierOutline(giftOpenForLevel),
											backgroundImage: tierCardGradient(giftOpenForLevel),
											backgroundColor: "transparent",
											backgroundRepeat: "no-repeat",
											backgroundSize: "200% 200%",
											backdropFilter: "blur(2px)",
										}}
									/>
									<Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>
										{tiers.find(t => t.level === giftOpenForLevel)?.name}
									</Typography>
									<Box sx={{ ml: "auto" }}>
										<Typography variant="h5" fontWeight={900} sx={{ color: "#c4b5fd" }}>
											FREE
										</Typography>
									</Box>
								</Stack>
								<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
									This gift grants the same benefits as the paid plan.
								</Typography>
							</Box>
						)}

						{/* What you get */}
						<Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
							What they get
						</Typography>
						<List dense>
							{sortedFeatureCatalog
								.filter((feature) =>
									feature.key === "previous"
										? (typeof giftOpenForLevel === "number" ? giftOpenForLevel : -1) >= feature.minLevel
										: feature.minLevel === (typeof giftOpenForLevel === "number" ? giftOpenForLevel : -1)
								)
								.map((feature) => (
									<ListItem key={`gift-${feature.key}`} disableGutters sx={{ py: 0.5, "&:not(:first-of-type)": { borderTop: "1px solid rgba(255,255,255,0.06)" } }}>
										<ListItemIcon sx={{ minWidth: 28 }}>
											<CheckCircleOutlineIcon sx={{ color: "#ffffff" }} fontSize="small" />
										</ListItemIcon>
										<ListItemText primaryTypographyProps={{ variant: "body2", sx: { color: "#ffffff" } }} primary={feature.label} />
									</ListItem>
								))}
						</List>

						<Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

						{/* Recipient input */}
						<TextField
							label="Recipient Discord User ID"
							value={giftRecipientId}
							onChange={(e) => setGiftRecipientId(e.target.value)}
							size="small"
							fullWidth
							InputLabelProps={{ shrink: true }}
							placeholder="e.g. 325603721243262978"
							sx={{
								"& .MuiInputBase-input": { color: "#fff" },
								"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
								"& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.24)" },
							}}
						/>

						{!!giftCode && (
							<Stack spacing={0.75} sx={{ mt: 1 }}>
								<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
									Gift Code (keep this safe)
								</Typography>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 1,
										p: 1,
										borderRadius: 1,
										bgcolor: "rgba(255,255,255,0.04)",
										border: "1px solid rgba(255,255,255,0.08)",
										fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
										letterSpacing: 1,
									}}
								>
									<Typography variant="body2" sx={{ color: "#fff", fontWeight: 900, wordBreak: "break-all" }}>
										{giftCode}
									</Typography>
									<IconButton size="small" onClick={copyGiftCode} aria-label="Copy gift code" title="Copy gift code">
										<ContentCopyIcon fontSize="inherit" />
									</IconButton>
								</Box>
								<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
									Share this code. Copy copies the full code to your clipboard.
								</Typography>
							</Stack>
						)}

						{!isAdmin ? (
							<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", display: "block", mt: 1 }}>
								Create a FREE gift code and share it with the recipient. They’ll log in and redeem it.
							</Typography>
						) : (
							<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", display: "block", mt: 1 }}>
								As admin, the gift is granted instantly to the entered Discord ID.
							</Typography>
						)}
					</DialogContent>
					<DialogActions sx={{ px: 2, py: 1.25 }}>
						<Button onClick={closeGift} disabled={giftBusy} color="inherit">Close</Button>
						<Button
							onClick={doGift}
							disabled={giftBusy || !giftRecipientId.trim()}
							variant="contained"
							disableElevation
							sx={{ fontWeight: 800, bgcolor: "#ffffff", color: "#0b0b0b", "&:hover": { bgcolor: "#f5f5f5" } }}
						>
							{giftBusy ? "Working..." : isAdmin ? "Grant Now" : (giftCode ? "Regenerate Code" : "Create Gift Code")}
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</section>
	);
}

// Compare table row model
type CompareRow =
	| { type: "feature"; key: FeatureKey; label: string }
	| { type: "bool"; label: string; values: boolean[] }
	| { type: "text"; label: string; values: string[] }
	| { type: "number"; label: string; values: number[] };

// Build sections: reuse featureCatalog only (remove picture-specific rows)
const compareSections: { title: string; rows: CompareRow[] }[] = [
	{
		title: "Features",
		rows: sortedFeatureCatalog.map((f) => ({ type: "feature", key: f.key, label: f.label } as const)),
	},
];

export default Membership;

function refreshMembershipFromDiscord() {
  throw new Error("Function not implemented.");
}
