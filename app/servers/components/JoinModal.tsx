"use client";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";

type LiveCount = { players: number; maxPlayers: number; online: boolean };
type JoinInfo = {
	id?: string;
	url: string;
	name: string;
	thumbnail?: string;
	carPack?: string | null;
	region?: string | null;
	tier?: string | null;
} | null;

type Props = {
	open: boolean;
	onClose: () => void;
	joinInfo: JoinInfo;
	joinCountdown: number;
	joinInitialPercent: number; // 0..100
	serverCounts: Record<string, LiveCount>;
	tierLabel: (t?: string | null) => string;
	tierColor: (t?: string | null) => string;
};

export default function JoinModal({ open, onClose, joinInfo, joinCountdown, joinInitialPercent, serverCounts, tierLabel, tierColor }: Props) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{ sx: { width: "min(900px, 94vw)", bgcolor: "rgba(10,8,16,0.62)", backdropFilter: "blur(8px) saturate(120%)", color: "#fff", px: 3, pt: 2.5, pb: 2, borderRadius: 2, border: "1px solid rgba(124,58,237,0.14)", boxShadow: "0 10px 60px rgba(124,58,237,0.18)" } }}
			BackdropProps={{ sx: { backgroundColor: "rgba(2,6,23,0.56)", backdropFilter: "blur(6px)" } }}
			scroll="paper"
		>
			<DialogContent sx={{ py: 1.5, px: 2, maxHeight: "80vh", overflowY: "auto" }}>
				<div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
					<div style={{ minWidth: 136, display: "flex", alignItems: "center", justifyContent: "center" }}>
						{joinInfo?.thumbnail ? (
							<img src={joinInfo.thumbnail} alt={joinInfo.name} style={{ width: 136, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }} />
						) : (
							<div style={{ width: 136, height: 80, borderRadius: 10, background: "linear-gradient(90deg,#0f172a,#24123b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>
								No Image
							</div>
						)}
					</div>

					<div style={{ flex: 1 }}>
						<div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
							<div style={{ minWidth: 0 }}>
								<div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{joinInfo?.name ?? "Joining server"}</div>
								<div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", color: "rgba(255,255,255,0.87)", fontSize: 13 }}>
									<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
										<DirectionsCarIcon fontSize="small" /> <span style={{ fontWeight: 800 }}>{joinInfo?.carPack ?? "Default Pack"}</span>
									</span>
									<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
										<PublicIcon fontSize="small" /> <span style={{ fontWeight: 800 }}>{joinInfo?.region ?? "Unknown"}</span>
									</span>
								</div>
							</div>

							{joinInfo?.tier && (
								<span style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: tierColor(joinInfo.tier), color: "#fff", fontWeight: 800, fontSize: 13 }}>
									{tierLabel(joinInfo.tier)}
								</span>
							)}
						</div>

						<hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.04)", margin: "12px 0" }} />

						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
							<div style={{ display: "flex", gap: 18, alignItems: "center", color: "rgba(255,255,255,0.9)", fontWeight: 800 }}>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<PeopleIcon fontSize="small" /> <span>{joinInfo?.id && serverCounts[joinInfo.id] ? `${serverCounts[joinInfo.id].players}/${serverCounts[joinInfo.id].maxPlayers}` : "N/A"}</span>
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<MapIcon fontSize="small" /> <span style={{ opacity: 0.9 }}>{joinInfo?.region ?? "—"}</span>
								</div>
							</div>

							<div style={{ textAlign: "right", minWidth: 96 }}>
								<div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Redirect in</div>
								<div style={{ fontSize: 22, fontWeight: 900, color: "#f0e6ff", textShadow: "0 0 14px rgba(124,58,237,0.6)" }}>
									{String(Math.floor(joinCountdown / 60)).padStart(2, "0")}:{String(joinCountdown % 60).padStart(2, "0")}
								</div>
							</div>
						</div>

						<div style={{ marginTop: 12, height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" }}>
							<div style={{ height: "100%", width: `${joinInitialPercent.toFixed(2)}%`, background: "linear-gradient(90deg,#7c3aed,#d6b3ff)", transition: "width 0.4s linear" }} />
						</div>
					</div>
				</div>

				<div style={{ marginTop: 12, color: "rgba(255,255,255,0.68)", textAlign: "center", fontSize: 13 }}>
					You will be taken to the server join page in a new tab. Click Open Now to proceed immediately or Cancel to abort.
				</div>
			</DialogContent>
			<DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
				<Button
					variant="contained"
					onClick={() => {
						if (joinInfo?.url) window.open(joinInfo.url, "_blank", "noopener,noreferrer");
						onClose();
					}}
					sx={{ color: "#fff", background: "linear-gradient(90deg,#9b6bff,#7c3aed)", boxShadow: "0 12px 40px rgba(124,58,237,0.22)", px: 3 }}
				>
					Open Now
				</Button>
				<Button variant="outlined" onClick={onClose} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.12)" }}>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
}
