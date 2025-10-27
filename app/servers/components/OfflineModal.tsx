"use client";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

type Props = {
	open: boolean;
	onClose: () => void;
	name?: string;
};

export default function OfflineModal({ open, onClose, name }: Props) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: "rgba(10,8,16,0.9)", color: "#fff", borderRadius: 2, border: "1px solid rgba(124,58,237,0.24)", boxShadow: "0 10px 40px rgba(124,58,237,0.18)" } }} BackdropProps={{ sx: { backgroundColor: "rgba(2,6,23,0.56)", backdropFilter: "blur(6px)" } }}>
			<DialogContent sx={{ py: 2.5 }}>
				<div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
					<WarningAmberIcon sx={{ color: "#f59e0b" }} />
					Server Offline
				</div>
				<div style={{ fontSize: 14, opacity: 0.9 }}>
					{name ? `${name} is currently offline.` : "This server is currently offline."}
					<br />
					We’re working on it ASAP. Please try again later.
				</div>
			</DialogContent>
			<DialogActions sx={{ pb: 2, px: 2 }}>
				<Button variant="contained" onClick={onClose} sx={{ background: "#7c3aed" }}>
					OK
				</Button>
			</DialogActions>
		</Dialog>
	);
}
