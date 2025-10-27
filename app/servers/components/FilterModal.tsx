"use client";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
	open: boolean;
	onClose: () => void;

	region: string;
	setRegion: (v: string) => void;
	tier: string;
	setTier: (v: string) => void;
	selectedTraffic: Set<string>;
	setSelectedTraffic: (s: Set<string>) => void;
	selectedCarPacks: Set<string>;
	setSelectedCarPacks: (s: Set<string>) => void;
	selectedMaps: Set<string>;
	setSelectedMaps: (s: Set<string>) => void;
	showOffline: boolean;
	setShowOffline: (v: boolean) => void;

	REGIONS: string[];
	TIERS: string[];
	TRAFFICS: string[];
	CARPACKS: string[];
	MAPS: string[];

	toggleSetValue: (current: Set<string>, val: string, setter: (s: Set<string>) => void) => void;
	clearFiltersInModal: () => void;
	applyFilters: () => void;
	tierLabel: (t?: string | null) => string;
};

export default function FilterModal(props: Props) {
	const {
		open, onClose,
		region, setRegion, tier, setTier,
		selectedTraffic, setSelectedTraffic, selectedCarPacks, setSelectedCarPacks, selectedMaps, setSelectedMaps,
		showOffline, setShowOffline,
		REGIONS, TIERS, TRAFFICS, CARPACKS, MAPS,
		toggleSetValue, clearFiltersInModal, applyFilters,
		tierLabel
	} = props;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			BackdropProps={{ sx: { backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" } }}
			PaperProps={{
				sx: {
					width: "min(820px, 92vw)",
					mx: "auto",
					bgcolor: "rgba(6,4,6,0.88)",
					color: "#fff",
					borderRadius: 3,
					overflow: "hidden",
					border: "1px solid rgba(139,40,255,0.36)",
					boxShadow: "0 12px 50px rgba(2,6,23,0.7), 0 0 30px rgba(139,40,255,0.06) inset",
				},
			}}
		>
			<div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<strong style={{ fontSize: 34, letterSpacing: 1, fontWeight: 900 }}>FILTER</strong>
				<IconButton onClick={onClose} sx={{ color: "#fff" }}>
					<CloseIcon />
				</IconButton>
			</div>

			<div style={{ padding: "0 24px 18px 24px" }}>
				<TextField variant="outlined" placeholder="Search Filters" fullWidth size="small" InputProps={{ sx: { background: "rgba(139,40,255,0.06)", color: "#fff", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" } }} />
			</div>

			<Divider sx={{ borderColor: "rgba(255,255,255,0.04)" }} />

			<DialogContent sx={{ px: 3, py: 2 }}>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
					<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
						<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Region</div>
						<FormGroup row>
							<Button size="small" variant={region === "All" ? "contained" : "outlined"} onClick={() => setRegion("All")} sx={{ mr: 1, mb: 1 }}>
								All
							</Button>
							{REGIONS.map((r) => (
								<Button key={r} size="small" variant={region === r ? "contained" : "outlined"} onClick={() => setRegion(r)} sx={{ mr: 1, mb: 1 }}>
									{r}
								</Button>
							))}
						</FormGroup>
					</div>

					<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
						<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Traffic Density</div>
						<FormGroup>
							{TRAFFICS.map((t) => (
								<FormControlLabel key={t} control={<Checkbox checked={selectedTraffic.has(t)} onChange={() => toggleSetValue(selectedTraffic, t, setSelectedTraffic)} sx={{ color: "rgba(139,40,255,0.9)" }} />} label={t} />
							))}
						</FormGroup>
					</div>

					<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
						<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Tier</div>
						<FormGroup row>
							<Button size="small" variant={tier === "All" ? "contained" : "outlined"} onClick={() => setTier("All")} sx={{ mr: 1, mb: 1 }}>
								All
							</Button>
							{TIERS.map((t) => (
								<Button key={t} size="small" variant={tier === t ? "contained" : "outlined"} onClick={() => setTier(t)} sx={{ mr: 1, mb: 1 }}>
									{tierLabel(t)}
								</Button>
							))}
						</FormGroup>
					</div>

					<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
						<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Car Packs</div>
						<FormGroup>
							{CARPACKS.map((c) => (
								<FormControlLabel key={c} control={<Checkbox checked={selectedCarPacks.has(c)} onChange={() => toggleSetValue(selectedCarPacks, c, setSelectedCarPacks)} sx={{ color: "rgba(139,40,255,0.9)" }} />} label={c} />
							))}
						</FormGroup>
					</div>

					<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
						<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Offline</div>
						<FormGroup>
							<FormControlLabel control={<Checkbox checked={showOffline} onChange={(_, v) => setShowOffline(v)} sx={{ color: "rgba(139,40,255,0.9)" }} />} label="Show offline servers" />
						</FormGroup>
					</div>

					<div style={{ gridColumn: "1 / -1", padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
						<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Map</div>
						<FormGroup sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
							{MAPS.map((m) => (
								<FormControlLabel key={m} control={<Checkbox checked={selectedMaps.has(m)} onChange={() => toggleSetValue(selectedMaps, m, setSelectedMaps)} sx={{ color: "rgba(139,40,255,0.9)" }} />} label={m} sx={{ width: "100%", mr: 0, mb: 0.5 }} />
							))}
						</FormGroup>
					</div>
				</div>
			</DialogContent>

			<DialogActions sx={{ p: 2, justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.04)", bgcolor: "rgba(0,0,0,0.6)" }}>
				<Button variant="outlined" onClick={clearFiltersInModal} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
					CLEAR FILTER
				</Button>
				<Button variant="contained" onClick={applyFilters} sx={{ background: "#8b28ff" }}>
					APPLY
				</Button>
			</DialogActions>
		</Dialog>
	);
}
