"use client";
import React from "react";

type Props = {
	secondsLeft: number;
	isFetching: boolean;
	totalPlayers: number;
	totalMaxPlayers: number;
	filteredCount: number;
};

export default function CountdownSummary({ secondsLeft, isFetching, totalPlayers, totalMaxPlayers, filteredCount }: Props) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 1600, margin: "0 auto", width: "100%", padding: "2 8px" }}>
			<div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
				<div style={{ height: "100%", width: `${(secondsLeft / 60) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", transition: "width 0.9s linear" }} />
			</div>

			<div style={{ minWidth: 260, textAlign: "right", fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
				{isFetching ? (
					<span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
						<svg width="20" height="20" viewBox="0 0 24 24">
							<g>
								<path fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" d="M12 2 A10 10 0 0 1 22 12" />
								<animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
							</g>
						</svg>
						<span style={{ fontSize: 13 }}>Fetching servers — updating list</span>
					</span>
				) : (
					<span>Next refresh: {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span>
				)}

				<div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
					<style>{`
						@keyframes pc-pulse {
							0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); transform: scale(1); }
							70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); transform: scale(1.04); }
							100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); transform: scale(1); }
						}
						.pc-circle { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#10b981,#059669); color: #fff; font-weight: 900; font-size: 11px; box-shadow: 0 6px 14px rgba(16,185,129,0.14), inset 0 1px 0 rgba(255,255,255,0.04); animation: pc-pulse 1.8s infinite ease-out; line-height: 1; }
					`}</style>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<div className="pc-circle">{totalPlayers}</div>
						<div style={{ fontSize: 13, opacity: 0.9, fontWeight: 900 }}>/ {totalMaxPlayers} Players Online</div>
					</div>
					<div style={{ fontWeight: 800, fontSize: 13 }}>{isFetching ? " " : `${filteredCount} server${filteredCount !== 1 ? "s" : ""} found`}</div>
				</div>
			</div>
		</div>
	);
}
