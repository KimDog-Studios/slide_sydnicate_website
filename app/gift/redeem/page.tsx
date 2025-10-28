"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Box, Stack, Typography, Button, TextField, Alert, Paper, Chip, Divider,
	CircularProgress,
	InputAdornment,
	IconButton,
	Tooltip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { keyframes } from "@mui/system";
import KeyboardReturnOutlinedIcon from "@mui/icons-material/KeyboardReturnOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ContactUs from "@/Components/ContactUs";

const tierOutline = (level: number) =>
	level === 3 ? "rgba(255,61,110,0.7)" : level === 2 ? "rgba(168,85,247,0.6)" : level === 1 ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.16)";
const tierCardGradient = (level: number) =>
	level === 3
		? "linear-gradient(180deg, rgba(255,61,110,0.28), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(255,61,110,0.35), transparent)"
		: level === 2
		? "linear-gradient(180deg, rgba(168,85,247,0.22), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(245,158,11,0.25), transparent)"
		: level === 1
		? "linear-gradient(180deg, rgba(59,130,246,0.22), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7)), radial-gradient(900px 320px at 110% -10%, rgba(20,184,166,0.25), transparent)"
		: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7))";

// Shimmer animation for the heading
const shimmer = keyframes`
  from { background-position: 0% 50%; }
  to   { background-position: 200% 50%; }
`;

export default function RedeemPage() {
	const sp = useSearchParams();
	const router = useRouter();
	const [codeInput, setCodeInput] = useState("");
	const invite = (process.env.NEXT_PUBLIC_DISCORD_INVITE || "").trim();
	const [redeeming, setRedeeming] = useState(false);

	// Format helpers (AAAA-AAAA-AAAA-AAAA-AAAA)
	const normalizeCode = (raw: string) => {
		const letters = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 20); // 5*4
		return letters.match(/.{1,4}/g)?.join("-") ?? letters;
	};
	const handleInputChange = (v: string) => setCodeInput(normalizeCode(v));
	const hasFullCode = codeInput.replace(/-/g, "").length === 20;

	// Visual 5×4 segment preview
	const segments = useMemo(() => {
		const raw = codeInput.split("-");
		return Array.from({ length: 5 }, (_, i) => (raw[i] || "").padEnd(4, "•"));
	}, [codeInput]);

	const status = sp.get("status"); // success | used | invalid | expired | join_guild_first | role_not_set | missing
	const heading = useMemo(() => {
		switch (status) {
			case "success": return { title: "Gift Redeemed", color: "#22c55e", icon: <CheckCircleOutlineIcon /> };
			case "used": return { title: "Already Redeemed", color: "#f97316", icon: <ErrorOutlineIcon /> };
			case "expired": return { title: "Gift Expired", color: "#f59e0b", icon: <ErrorOutlineIcon /> };
			case "join_guild_first": return { title: "Join the Discord Server", color: "#60a5fa", icon: <ErrorOutlineIcon /> };
			case "role_not_set": return { title: "Server Not Configured", color: "#ef4444", icon: <ErrorOutlineIcon /> };
			case "missing":
			case "invalid":
			default: return { title: "Invalid Gift Link", color: "#ef4444", icon: <ErrorOutlineIcon /> };
		}
	}, [status]);

	// Redeem now via POST /api/gift/redeem
	const redeemNow = async (maybeCode?: string) => {
		const code = (maybeCode ?? codeInput).trim();
		if (!code) return;
		try {
			setRedeeming(true);
			const res = await fetch("/api/gift/redeem", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ code }),
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok && data?.ok) {
				router.replace("/gift/redeem?status=success");
				return;
			}
			const err = String(data?.error || "");
			if (res.status === 404) {
				router.replace("/gift/redeem?status=invalid");
			} else if (res.status === 400 && err.toLowerCase().includes("expired")) {
				router.replace("/gift/redeem?status=expired");
			} else if (err.toLowerCase().includes("failed to grant role")) {
				router.replace("/gift/redeem?status=join_guild_first");
			} else {
				router.replace("/gift/redeem?status=invalid");
			}
		} finally {
			setRedeeming(false);
		}
	};

	// Autofill and redeem when ?code= is present
	useEffect(() => {
		const q = sp.get("code");
		if (q) {
			setCodeInput(normalizeCode(q));
			redeemNow(q);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sp]);

	// Adornment actions
	const pasteFromClipboard = async () => {
		try {
			const t = await navigator.clipboard.readText();
			if (t) handleInputChange(t);
		} catch {}
	};
	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(codeInput);
		} catch {}
	};
	const clearCode = () => setCodeInput("");

	// Submit on Enter
	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && hasFullCode && !redeeming) redeemNow();
	};

	// FAQs
	const faqs = useMemo(
		() => [
			{ q: "What format should the code be?", a: "Five groups of four letters, like AAAA-AAAA-AAAA-AAAA-AAAA." },
			{ q: "How long do codes last?", a: "Codes expire 7 days after creation." },
			{ q: "It says I need to join the Discord server", a: "Join the server first so the role can be granted." },
			{ q: "My code shows used or invalid", a: "Check the code and try again, or ask the sender for a new one." },
			{ q: "What happens when I redeem?", a: "Your Discord role is updated for the guild." },
			{ q: "Do you offer refunds?", a: "No. We do not offer refunds for gift codes or standard purchases." },
		],
		[]
	);

	return (
		<Box
			sx={{
				minHeight: "100vh",
				px: 0,
				pt: 0,
				pb: 0,
				position: "relative",
				"&::before": {
					content: '""',
					position: "fixed",
					inset: 0,
					background:
						"radial-gradient(800px 400px at 20% -10%, rgba(124,58,237,0.18), transparent), radial-gradient(800px 400px at 120% 110%, rgba(168,85,247,0.12), transparent)",
					pointerEvents: "none",
				},
				// Fill the whole page with the grid squares
				"&::after": {
					content: '""',
					position: "fixed",
					inset: 0,
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
					backgroundSize: "24px 24px, 24px 24px",
					// removed mask so the squares cover the entire viewport
					opacity: 0.8,
					pointerEvents: "none",
				},
			}}
		>
			<Paper
				variant="outlined"
				sx={{
					position: "relative",
					p: 0,
					width: "100%",
					height: "auto",
					minHeight: "100vh",
					maxWidth: "100%",
					borderRadius: 0,
					borderColor: "transparent",
					backgroundColor: "#0b0b0b",
					backgroundImage: tierCardGradient(2),
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					color: "#fff",
					backdropFilter: "blur(10px)",
					boxShadow: "none",
					"&::before": {
						content: '""',
						position: "absolute",
						inset: 0,
						borderRadius: 0,
						padding: "1px",
						background: "linear-gradient(90deg,#7c3aed,#b388ff,#a78bfa)",
						WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
						WebkitMaskComposite: "xor",
						maskComposite: "exclude",
						opacity: 0.25,
						pointerEvents: "none",
					},
				}}
			>
				{/* Full-screen container with readable width */}
				<Box sx={{ maxWidth: 900, mx: "auto", px: 2, pt: { xs: 12, sm: 14 }, pb: 6, height: "auto", display: "flex", flexDirection: "column" }}>
					<Stack spacing={1.25} alignItems="flex-start" sx={{ flex: 1 }}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", justifyContent: "space-between" }}>
							<Chip
								icon={<LockOutlinedIcon sx={{ color: "#93c5fd" }} />}
								label="Secure redemption"
								variant="outlined"
								sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)", backdropFilter: "blur(2px)", fontWeight: 700 }}
							/>
							<Chip label="Gift Redemption" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)", backdropFilter: "blur(2px)", fontWeight: 700 }} />
						</Stack>

						<Stack direction="row" spacing={1.25} alignItems="center">
							<Typography
								variant="h4"
								fontWeight={900}
								sx={{
									background: "linear-gradient(90deg,#c4b5fd,#7c3aed,#c4b5fd)",
									WebkitBackgroundClip: "text",
									color: "transparent",
									textShadow: "0 0 10px rgba(124,58,237,0.35)",
									backgroundSize: "200% 200%",
									animation: `${shimmer} 4s linear infinite`,
								}}
							>
								{heading.title}
							</Typography>
							<Box sx={{ color: heading.color, filter: "drop-shadow(0 0 10px rgba(124,58,237,0.6))" }}>
								{heading.icon}
							</Box>
						</Stack>

						<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
							Enter your 5×4 code below to unlock your tier instantly.
						</Typography>

						{/* Status messages */}
						{status === "success" && (
							<Alert severity="success" variant="outlined" sx={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.08)" }}>
								You now have access. If you don’t see your role, rejoin or refresh Discord.
							</Alert>
						)}
						{status === "used" && (
							<Alert severity="warning" variant="outlined" sx={{ color: "#f97316", borderColor: "rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.08)" }}>
								This gift link has already been redeemed.
							</Alert>
						)}
						{status === "join_guild_first" && (
							<Alert severity="info" variant="outlined" sx={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.35)", background: "rgba(96,165,250,0.08)" }}>
								Join the Discord server first, then retry the link.
							</Alert>
						)}
						{(status === "invalid" || status === "missing" || status === "expired" || status === "role_not_set") && (
							<Alert severity="error" variant="outlined" sx={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)" }}>
								{status === "expired" ? "This gift link has expired." : "This gift link is not valid."}
							</Alert>
						)}

						<Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

						{/* Code box */}
						<Box
							sx={{
								width: "100%",
								p: 2,
								borderRadius: 2,
								border: "1px solid rgba(255,255,255,0.08)",
								background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.25))",
							}}
						>
							<Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
								Have a gift code?
							</Typography>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
								<TextField
									fullWidth
									size="medium"
									placeholder="AAAA-AAAA-AAAA-AAAA-AAAA"
									value={codeInput}
									onChange={(e) => handleInputChange(e.target.value)}
									onKeyDown={onKeyDown}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<KeyRoundedIcon sx={{ color: "#c4b5fd" }} />
											</InputAdornment>
										),
										endAdornment: (
											<InputAdornment position="end" sx={{ gap: 0.5 }}>
												<Tooltip title="Paste">
													<span>
														<IconButton size="small" onClick={pasteFromClipboard} sx={{ color: "#cbd5e1" }}>
															<ContentPasteOutlinedIcon fontSize="small" />
														</IconButton>
													</span>
												</Tooltip>
												<Tooltip title="Clear">
													<span>
														<IconButton size="small" onClick={clearCode} disabled={!codeInput} sx={{ color: "#cbd5e1", opacity: codeInput ? 1 : 0.4 }}>
															<BackspaceOutlinedIcon fontSize="small" />
														</IconButton>
													</span>
												</Tooltip>
												<Tooltip title="Copy" disableInteractive>
													<span>
														<IconButton size="small" onClick={copyToClipboard} disabled={!hasFullCode} sx={{ color: "#cbd5e1", opacity: hasFullCode ? 1 : 0.4 }}>
															<ContentCopyOutlinedIcon fontSize="small" />
														</IconButton>
													</span>
												</Tooltip>
											</InputAdornment>
										),
									}}
									inputProps={{
										inputMode: "text",
										autoCapitalize: "characters",
										autoCorrect: "off",
										spellCheck: "false",
										maxLength: 29, // 5*4 + 4 dashes
										style: {
											letterSpacing: 2,
											fontWeight: 900,
											fontFamily:
												"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
										},
									}}
									sx={{
										"& .MuiInputBase-input": { color: "#fff" },
										"& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.24)" },
									}}
								/>
								<Button
									variant="contained"
									disableElevation
									onClick={() => redeemNow()}
									disabled={!hasFullCode || redeeming}
									sx={{
										background: "linear-gradient(90deg,#ffffff,#d4d4d4)",
										color: "#0b0b0b",
										fontWeight: 900,
										minWidth: 160,
										px: 2.5,
										"&:hover": { background: "linear-gradient(90deg,#f5f5f5,#e5e5e5)" },
									}}
								>
									{redeeming ? <CircularProgress size={18} color="inherit" /> : "Redeem"}
								</Button>
							</Stack>

							{/* Segmented preview */}
							<Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
								{segments.map((seg, i) => (
									<Box
										key={`seg-${i}`}
										sx={{
											px: 1.25,
											py: 0.5,
											borderRadius: 1,
											border: "1px solid rgba(255,255,255,0.12)",
											background: "rgba(255,255,255,0.04)",
											fontFamily:
												"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
											fontWeight: 900,
											letterSpacing: 2,
											color: seg.includes("•") ? "rgba(255,255,255,0.65)" : "#fff",
										}}
									>
										{seg}
									</Box>
								))}
							</Stack>

							<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", display: "block", mt: 0.75 }}>
								Format: 5 groups of 4 letters, e.g. AAAA-AAAA-AAAA-AAAA-AAAA. Press Enter to redeem.
							</Typography>
						</Box>

						{/* Context actions */}
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: "auto" }}>
							<Button href="/" variant="text" sx={{ color: "#fff", textDecoration: "underline", textUnderlineOffset: "4px" }}>
								Back to Home
							</Button>
							{status === "join_guild_first" && invite && (
								<Button
									href={invite}
									target="_blank"
									rel="noopener noreferrer"
									variant="contained"
									disableElevation
									sx={{
										background: "linear-gradient(90deg,#6d28d9,#7c3aed)",
										color: "#fff",
										fontWeight: 900,
										"&:hover": { background: "linear-gradient(90deg,#7c3aed,#8b5cf6)" },
									}}
								>
									Join Discord
								</Button>
							)}
						</Stack>

						<Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

						{/* How it works (enhanced) */}
						<Box
							sx={{
								width: "100%",
								position: "relative",
								p: 2,
								borderRadius: 2,
								border: "1px solid rgba(255,255,255,0.08)",
								background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.22))",
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									position: "absolute",
									inset: 0,
									background:
										"radial-gradient(800px 320px at 120% -20%, rgba(124,58,237,0.18), transparent), radial-gradient(800px 320px at -20% 120%, rgba(167,139,250,0.12), transparent)",
									pointerEvents: "none",
								}}
							/>
							<Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 900, mb: 1 }}>
								How it works
							</Typography>
							<Stack spacing={1}>
								{/* Step 1 */}
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.25,
										p: 1,
										borderRadius: 1.5,
										bgcolor: "rgba(255,255,255,0.03)",
										border: "1px solid rgba(255,255,255,0.06)",
									}}
								>
									<Box
										sx={{
											width: 28,
											height: 28,
											borderRadius: "9999px",
											background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
											color: "#fff",
											fontWeight: 900,
											display: "grid",
											placeItems: "center",
											fontSize: 13,
											boxShadow: "0 0 10px rgba(124,58,237,0.35)",
										}}
									>
										1
									</Box>
									<ContentPasteOutlinedIcon sx={{ color: "#c4b5fd" }} />
									<Typography variant="body2" sx={{ color: "#fff" }}>
										Paste or type your 5×4 code into the box above.
									</Typography>
								</Box>
								{/* Step 2 */}
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.25,
										p: 1,
										borderRadius: 1.5,
										bgcolor: "rgba(255,255,255,0.03)",
										border: "1px solid rgba(255,255,255,0.06)",
									}}
								>
									<Box
										sx={{
											width: 28,
											height: 28,
											borderRadius: "9999px",
											background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
											color: "#fff",
											fontWeight: 900,
											display: "grid",
											placeItems: "center",
											fontSize: 13,
											boxShadow: "0 0 10px rgba(124,58,237,0.35)",
										}}
									>
										2
									</Box>
									<KeyboardReturnOutlinedIcon sx={{ color: "#c4b5fd" }} />
									<Typography variant="body2" sx={{ color: "#fff" }}>
										Click <strong>Redeem</strong> or press <strong>Enter</strong> to submit your code.
									</Typography>
								</Box>
								{/* Step 3 */}
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.25,
										p: 1,
										borderRadius: 1.5,
										bgcolor: "rgba(255,255,255,0.03)",
										border: "1px solid rgba(255,255,255,0.06)",
									}}
								>
									<Box
										sx={{
											width: 28,
											height: 28,
											borderRadius: "9999px",
											background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
											color: "#fff",
											fontWeight: 900,
											display: "grid",
											placeItems: "center",
											fontSize: 13,
											boxShadow: "0 0 10px rgba(124,58,237,0.35)",
										}}
									>
										3
									</Box>
									<VerifiedOutlinedIcon sx={{ color: "#86efac" }} />
									<Typography variant="body2" sx={{ color: "#fff" }}>
										Your Discord role is granted automatically if you’re in the server.
									</Typography>
								</Box>
							</Stack>
						</Box>

						{/* FAQ */}
						<Box sx={{ mt: 2, width: "100%" }}>
							<Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
								FAQ
							</Typography>
							<Stack spacing={1}>
								{faqs.map((item, idx) => (
									<Accordion
										key={`faq-${idx}`}
										disableGutters
										sx={{
											bgcolor: "transparent",
											border: "1px solid rgba(255,255,255,0.08)",
											borderRadius: 1.5,
											"&::before": { display: "none" },
											overflow: "hidden",
											backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.2))",
										}}
									>
										<AccordionSummary
											expandIcon={<ExpandMoreIcon sx={{ color: "#cbd5e1" }} />}
											sx={{ "& .MuiAccordionSummary-content": { my: 0.5 } }}
										>
											<Typography variant="body2" sx={{ color: "#fff", fontWeight: 800 }}>
												{item.q}
											</Typography>
										</AccordionSummary>
										<AccordionDetails sx={{ pt: 0, pb: 2 }}>
											<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
												{item.a}
											</Typography>
										</AccordionDetails>
									</Accordion>
								))}
							</Stack>
						</Box>
					</Stack>
				</Box>

				{/* Contact Us section inside the outlined background */}
				<Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 6 }}>
					<Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.08)" }} />
					<ContactUs />
				</Box>
			</Paper>
		</Box>
	);
}
