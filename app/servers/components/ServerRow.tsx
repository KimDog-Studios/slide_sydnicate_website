"use client";
import React from "react";
import Button from "@mui/material/Button";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import TrafficIcon from "@mui/icons-material/Traffic";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { DEFAULT_IP, type Server } from "../config";

export type LiveCount = { players: number; maxPlayers: number; online: boolean };

type Props = {
	server: Server;
	stat?: LiveCount;
	changed: boolean;
	isFetching: boolean;
	onJoin: (server: Server, joinUrl: string) => void;
	onOffline: (name: string) => void;
	tierLabel: (t?: string | null) => string;
	tierColor: (t?: string | null) => string;
};

export default function ServerRow({ server: s, stat, changed, isFetching, onJoin, onOffline, tierLabel, tierColor }: Props) {
	const joinUrl = `https://acstuff.ru/s/q:race/online/join?ip=${encodeURIComponent(DEFAULT_IP)}&httpPort=${encodeURIComponent(String(s.httpPort))}`;

	return (
		<div role="row" className={`server-card${changed ? " changed" : ""}`}>
			<div style={{ minWidth: 0 }}>
				<div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
					{s.thumbnail ? (
						<img src={s.thumbnail} alt={s.name} style={{ width: 80, height: 48, objectFit: "cover", borderRadius: 6 }} />
					) : (
						<div style={{ width: 80, height: 48, background: "linear-gradient(90deg,#0f172a,#24123b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", borderRadius: 6 }}>
							{s.map.split(" ").slice(0, 2).map((w: string) => w[0] ?? "").join("")}
						</div>
					)}
					<div style={{ minWidth: 0, overflow: "hidden" }}>
						<div style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
						<div style={{ fontSize: 13, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.map}</div>
					</div>
				</div>
			</div>

			<div style={{ whiteSpace: "nowrap" }}>
				<span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: tierColor(s.tier), color: "#fff", fontWeight: 800, fontSize: 13 }}>{tierLabel(s.tier)}</span>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
				<PublicIcon fontSize="small" />
				{s.region}
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
				<DirectionsCarIcon fontSize="small" />
				{s.carPack ?? "Default Pack"}
			</div>

			<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
				<PeopleIcon fontSize="small" style={{ marginRight: 6 }} />
				{stat ? (
					stat.online ? (
						stat.players >= stat.maxPlayers ? (
							<span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#ef4444", fontWeight: 900 }}>
								<WarningAmberIcon fontSize="small" sx={{ color: "#ef4444" }} />
								Full
							</span>
						) : (
							`${stat.players}/${stat.maxPlayers}`
						)
					) : (
						<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
							<WarningAmberIcon fontSize="small" sx={{ color: "#f59e0b" }} />
							Offline
						</span>
					)
				) : (
					"—"
				)}
			</div>

			<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
				<TrafficIcon fontSize="small" style={{ marginRight: 6 }} />
				{s.trafficDensity}
			</div>

			<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
				<MapIcon fontSize="small" style={{ marginRight: 6 }} />
				{s.map}
			</div>

			<div style={{ textAlign: "right" }}>
				<Button
					size="small"
					onClick={() => {
						if (stat && stat.online) onJoin(s, joinUrl);
						else onOffline(s.name);
					}}
					disabled={isFetching}
					sx={{ padding: "6px 12px", borderRadius: 1, background: stat && !stat.online ? "#6b7280" : "#7c3aed", color: "#fff", fontWeight: 800, textTransform: "none" }}
				>
					{stat && !stat.online ? (
						<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
							<WarningAmberIcon fontSize="small" sx={{ color: "#f59e0b" }} />
							Offline
						</span>
					) : (
						"Join"
					)}
				</Button>
			</div>
		</div>
	);
}
