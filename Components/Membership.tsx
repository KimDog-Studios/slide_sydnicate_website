import React, { useState } from "react";
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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

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
  const FX_CACHE_KEY = "fx:USD:exchangerate.host";
  const FX_TTL_MS = 12 * 60 * 60 * 1000; // 12h

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

  // Taglines per tier (by level)
  const tierTaglines = [
    "Jump in and warm up.",        // Tier 0 (Paddock Access)
    "Dial in your first tunes.",   // Tier 1 (Streetline)
    "Chase and lead with confidence.", // Tier 2 (Tandem Club)
    "Full-send, competition ready.",   // Tier 3 (Pro Line)
  ];

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
                              {price.main}
                              {price.cadence && (
                                <Typography
                                  component="span"
                                  variant="subtitle2"
                                  sx={{ color: "#ffffff" }}
                                  className="ml-1"
                                >
                                  {price.cadence}
                                </Typography>
                              )}
                            </Typography>
                            {price.sub && (
                              <Typography
                                variant="caption"
                                sx={{ color: "rgba(255,255,255,0.9)" }}
                              >
                                {price.sub}
                              </Typography>
                            )}
                          </Box>
                        </Fade>
                      }
                    />

                    <CardContent sx={{ px: 2.5, py: 2 }}>
                      <Stack spacing={1.5}>
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
                            ...(tier.action.emphasis === "muted"
                              ? { pointerEvents: "none" }
                              : {}),
                          }}
                        >
                          {tier.action.label}
                        </Button>

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
                        >
                          Send as a Gift
                        </Button>

                        <List dense className="space-y-0">
                          {sortedFeatureCatalog
                            .filter((feature) =>
                              // Show "previous" once when unlocked, otherwise only features introduced at this tier
                              feature.key === "previous"
                                ? tier.level >= feature.minLevel
                                : feature.minLevel === tier.level
                            )
                             .map((feature) => {
                               const label = tier.featureNotes?.[feature.key] ?? feature.label;
                               return (
                                 <ListItem
                                   key={feature.key}
                                   disableGutters
                                   sx={{
                                     py: 0.5,
                                     "&:not(:first-of-type)": { borderTop: "1px solid rgba(255,255,255,0.06)" },
                                   }}
                                >
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <CheckCircleOutlineIcon sx={{ color: "#ffffff" }} fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primaryTypographyProps={{ variant: "body2", sx: { color: "#ffffff" } }}
                                    primary={label}
                                  />
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
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1 }}>
                      {p.main}
                      <Typography component="span" variant="caption" sx={{ color: "#fff", ml: 0.5 }}>
                        {p.cadence}
                      </Typography>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#fff", opacity: 0.85, mt: 0.5, display: "block" }}
                    >
                      {tierTaglines[t.level]}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      sx={{
                        bgcolor: "#fff",
                        color: "#0b0b0b",
                        borderRadius: 9999,
                        px: 2.5,
                        py: 0.75,
                        "&:hover": { bgcolor: "#f5f5f5" },
                      }}
                    >
                      {t.action.label}
                    </Button>
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