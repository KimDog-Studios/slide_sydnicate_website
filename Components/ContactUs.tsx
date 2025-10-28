import React, { useMemo, useState } from "react";
import {
	Box,
	Paper,
	Stack,
	Typography,
	TextField,
	InputAdornment,
	Button,
	Alert,
	Snackbar,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

function ContactUs() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [msg, setMsg] = useState("");
	const [busy, setBusy] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({
		open: false,
		msg: "",
		sev: "success",
	});

	const MAX = 400;
	const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
	const nameOk = name.trim().length >= 2;
	const msgOk = msg.trim().length >= 10 && msg.trim().length <= MAX;
	const canSend = nameOk && emailOk && msgOk && !busy;

	const closeToast = () => setToast((t) => ({ ...t, open: false }));

	const onSubmit = async () => {
		if (!canSend) return;
		setBusy(true);
		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), email: email.trim(), message: msg.trim() }),
			});
			if (!res.ok) throw new Error("Failed to send");
			setToast({ open: true, msg: "Thanks! We’ll get back to you shortly.", sev: "success" });
			setName(""); setEmail(""); setMsg("");
		} catch {
			setToast({ open: true, msg: "Could not send your message. Try again later.", sev: "error" });
		} finally {
			setBusy(false);
		}
	};

	return (
		<Box
			sx={{
				// transparent outer container so only the inner card is black
				bgcolor: "transparent",
				px: { xs: 2, sm: 3 },
				pt: { xs: 12, sm: 14 }, // clear TopBar
				pb: { xs: 2, sm: 3 },   // modest bottom padding only
			}}
		>
			{/* Columns without desktop gap; both auto-sized so they sit close */}
			<Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					rowGap: { xs: 1, md: 0 },
					columnGap: 0,
					alignItems: { xs: "flex-start", md: "center" },
					justifyContent: "center",
					maxWidth: 800,
					mx: "auto",
				}}
			>
				{/* Left: hero question text (auto-sized) */}
				<Box sx={{ flex: "0 0 auto" }}>
					<Typography
						component="h2"
						sx={{
							fontWeight: 900,
							textTransform: "uppercase",
							lineHeight: 0.96,
							letterSpacing: 0.6,
							fontSize: { xs: 36, sm: 48, md: 64 },
							background: "linear-gradient(180deg,#ffffff,#9ca3af)",
							WebkitBackgroundClip: "text",
							color: "transparent",
							textShadow: "0 0 16px rgba(255,255,255,0.08)",
							userSelect: "none",
						}}
					>
						Questions?
						<br /> No problem,
						<br /> we have the
						<br /> answers.
					</Typography>
				</Box>

				{/* Right: black form card (auto-sized) */}
				<Box sx={{ flex: "0 0 auto", width: "100%" }}>
					<Paper
						variant="outlined"
						sx={{
							width: "100%",
							maxWidth: 720,
							p: { xs: 2.5, sm: 3.5 },
							borderRadius: 2,
							borderColor: "rgba(255,255,255,0.08)",
							background: "#0b0b0b",
							color: "#fff",
							boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
						}}
					>
						<Stack spacing={2}>
							<Typography
								component="h1"
								sx={{
									fontWeight: 900,
									fontSize: { xs: 24, sm: 28 },
									letterSpacing: 0.5,
									background: "linear-gradient(90deg,#c4b5fd,#7c3aed)",
									WebkitBackgroundClip: "text",
									color: "transparent",
									textShadow: "0 0 12px rgba(124,58,237,0.35)",
								}}
							>
								Contact us
							</Typography>

							<Alert
								severity="warning"
								variant="outlined"
								icon={false}
								sx={{
									borderColor: "rgba(253,224,71,0.35)",
									background: "rgba(253,224,71,0.08)",
									color: "#fde047",
									fontWeight: 700,
								}}
							>
								We may take up to 24–72 hours to reply
							</Alert>

							{/* Softer fields (light grey bg, softer borders, darker grey text) */}
							<TextField
								label="Name"
								variant="outlined"
								value={name}
								onChange={(e) => setName(e.target.value)}
								fullWidth
								size="medium"
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<PersonOutlineIcon sx={{ color: "#6b7280" }} />
										</InputAdornment>
									),
								}}
								InputLabelProps={{ shrink: true, sx: { color: "#374151 !important" } }}
								helperText={!nameOk && name ? "Enter at least 2 characters" : " "}
								sx={{
									"& .MuiOutlinedInput-root": {
										bgcolor: "#f3f4f6", // softer than white
										color: "#111827",
										borderRadius: 1,
										"& fieldset": { borderColor: "rgba(17,24,39,0.14)" },
										"&:hover fieldset": { borderColor: "rgba(17,24,39,0.24)" },
										"&.Mui-focused fieldset": { borderColor: "#7c3aed", boxShadow: "0 0 0 2px rgba(124,58,237,0.25)" },
									},
									"& .MuiInputBase-input": { color: "#111827" },
									"& .MuiFormHelperText-root": { color: "#4b5563" },
								}}
							/>
							<TextField
								label="Email"
								type="email"
								variant="outlined"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								fullWidth
								size="medium"
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<AlternateEmailIcon sx={{ color: "#6b7280" }} />
										</InputAdornment>
									),
								}}
								InputLabelProps={{ shrink: true, sx: { color: "#374151 !important" } }}
								helperText={!emailOk && email ? "Enter a valid email" : " "}
								sx={{
									"& .MuiOutlinedInput-root": {
										bgcolor: "#f3f4f6",
										color: "#111827",
										borderRadius: 1,
										"& fieldset": { borderColor: "rgba(17,24,39,0.14)" },
										"&:hover fieldset": { borderColor: "rgba(17,24,39,0.24)" },
										"&.Mui-focused fieldset": { borderColor: "#7c3aed", boxShadow: "0 0 0 2px rgba(124,58,237,0.25)" },
									},
									"& .MuiInputBase-input": { color: "#111827" },
									"& .MuiFormHelperText-root": { color: "#4b5563" },
								}}
							/>
							<Box>
								<TextField
									label="Your question"
									variant="outlined"
									value={msg}
									onChange={(e) => setMsg(e.target.value.slice(0, MAX))}
									fullWidth
									multiline
									minRows={5}
									size="medium"
									InputProps={{
										endAdornment: (
											<InputAdornment position="end" sx={{ alignSelf: "flex-start", pt: 1 }}>
												<ChatBubbleOutlineIcon sx={{ color: "#6b7280" }} />
											</InputAdornment>
										),
									}}
									InputLabelProps={{ shrink: true, sx: { color: "#374151 !important" } }}
									helperText={!msgOk && msg ? "Message must be 10–400 characters" : " "}
									sx={{
										"& .MuiOutlinedInput-root": {
											bgcolor: "#f3f4f6",
											color: "#111827",
											borderRadius: 1,
											"& fieldset": { borderColor: "rgba(17,24,39,0.14)" },
											"&:hover fieldset": { borderColor: "rgba(17,24,39,0.24)" },
											"&.Mui-focused fieldset": { borderColor: "#7c3aed", boxShadow: "0 0 0 2px rgba(124,58,237,0.25)" },
										},
										"& .MuiInputBase-input": { color: "#111827" },
										"& .MuiFormHelperText-root": { color: "#4b5563" },
									}}
								/>
								<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", display: "block", textAlign: "right", mt: -2 }}>
									{msg.length}/{MAX}
								</Typography>
							</Box>

							<Button
								onClick={onSubmit}
								disabled={!canSend}
								variant="contained"
								disableElevation
								fullWidth
								sx={{
									mt: 0.5,
									background: "linear-gradient(90deg,#8b5cf6,#7c3aed,#8b5cf6)",
									backgroundSize: "200% 100%",
									color: "#fff",
									fontWeight: 900,
									py: 1.25,
									borderRadius: 2,
									boxShadow: "0 0 24px rgba(139,92,246,0.65), 0 8px 24px rgba(124,58,237,0.45)",
									transition: "background-position 300ms ease, transform 120ms ease",
									"&:hover": { backgroundPosition: "100% 0", transform: "translateY(-1px)" },
									// Keep button purple even when disabled (reduced opacity)
									"&.Mui-disabled": {
										background: "linear-gradient(90deg,#8b5cf6,#7c3aed,#8b5cf6)",
										backgroundSize: "200% 100%",
										opacity: 0.55,
										color: "rgba(255,255,255,0.9)",
										boxShadow: "none",
									},
								}}
							>
								SEND
							</Button>
						</Stack>
					</Paper>
				</Box>
			</Box>

			<Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
				<Alert onClose={closeToast} severity={toast.sev} variant="filled" sx={{ width: "100%" }}>
					{toast.msg}
				</Alert>
			</Snackbar>
		</Box>
	);
}

export default ContactUs;