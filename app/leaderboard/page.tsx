"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";

type LeaderboardEntry = {
	id: string;
	player: string;
	score: number;
	wins?: number;
	laps?: number;
	carPack?: string;
	map?: string;
	region?: string;
	server?: string;
	lastSeen?: string; // ISO 8601
};

type OrderKey = "score" | "player" | "lastSeen";

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
	// data
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// filters
	const [search, setSearch] = useState("");
	const [region, setRegion] = useState<string>("All");
	const [carPack, setCarPack] = useState<string>("All");
	const [map, setMap] = useState<string>("All");
	const [range, setRange] = useState<"24h" | "7d" | "30d" | "all">("30d");

	// sort + pagination
	const [orderBy, setOrderBy] = useState<OrderKey>("score");
	const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState<number>(1);

	// fetch (no demo fallback; show empty on error)
	const loadData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/leaderboard?range=${range}`, { cache: "no-store" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as LeaderboardEntry[];
			setEntries(Array.isArray(data) ? data : []);
		} catch {
			setEntries([]);
			setError("Failed to load leaderboard");
		} finally {
			setLoading(false);
		}
	}, [range]);

	useEffect(() => {
		void loadData();
	}, [loadData]);

	// derived options
	const regions = useMemo(() => ["All", ...Array.from(new Set(entries.map(e => e.region).filter(Boolean))) as string[]], [entries]);
	const carPacks = useMemo(() => ["All", ...Array.from(new Set(entries.map(e => e.carPack).filter(Boolean))) as string[]], [entries]);
	const maps = useMemo(() => ["All", ...Array.from(new Set(entries.map(e => e.map).filter(Boolean))) as string[]], [entries]);

	// filtering
	const searchLower = search.trim().toLowerCase();
	const filtered = useMemo(() => {
		const now = Date.now();
		const rangeMs = range === "24h" ? 24 * 3600e3 : range === "7d" ? 7 * 24 * 3600e3 : range === "30d" ? 30 * 24 * 3600e3 : Number.POSITIVE_INFINITY;

		return entries.filter(e => {
			if (searchLower && !e.player.toLowerCase().includes(searchLower)) return false;
			if (region !== "All" && e.region !== region) return false;
			if (carPack !== "All" && e.carPack !== carPack) return false;
			if (map !== "All" && e.map !== map) return false;
			if (range !== "all" && e.lastSeen) {
				const ts = Date.parse(e.lastSeen);
				if (!isNaN(ts) && now - ts > rangeMs) return false;
			}
			return true;
		});
	}, [entries, searchLower, region, carPack, map, range]);

	// sort
	const sorted = useMemo(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			let cmp = 0;
			if (orderBy === "score") {
				cmp = (a.score ?? 0) - (b.score ?? 0);
			} else if (orderBy === "player") {
				cmp = a.player.localeCompare(b.player);
			} else {
				const ta = a.lastSeen ? Date.parse(a.lastSeen) : 0;
				const tb = b.lastSeen ? Date.parse(b.lastSeen) : 0;
				cmp = ta - tb;
			}
			return orderDir === "asc" ? cmp : -cmp;
		});
		return arr;
	}, [filtered, orderBy, orderDir]);

	// score range for progress bar
	const maxScore = useMemo(() => Math.max(1, ...sorted.map(e => e.score ?? 0)), [sorted]);

	// pagination
	const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
	const pageItems = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

	// handlers
	const toggleSort = (key: OrderKey) => {
		if (orderBy === key) setOrderDir(d => (d === "asc" ? "desc" : "asc"));
		else {
			setOrderBy(key);
			setOrderDir(key === "player" ? "asc" : "desc");
		}
	};
	const resetFilters = () => {
		setSearch("");
		setRegion("All");
		setCarPack("All");
		setMap("All");
		setRange("30d");
		setPage(1);
	};

	// helpers
	const initials = (name: string) => name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
	const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

	// UI
	return (
		<React.Fragment>
			<style>{`
				.lb-toolbar {
					display: grid;
					grid-template-columns: 2fr 1fr 1fr 1fr auto auto;
					gap: 10px;
					align-items: center;
					background: rgba(10,8,15,0.4);
					border: 1px solid rgba(139,40,255,0.18);
					border-radius: 12px;
					padding: 12px;
					box-shadow: 0 8px 22px rgba(139,40,255,0.06) inset;
				}
				.lb-card {
					display: grid;
					grid-template-columns: 80px 1.2fr 1.2fr 110px 100px 260px 170px;
					align-items: center;
					gap: 10px;
					padding: 14px;
					margin-bottom: 12px;
					background: linear-gradient(180deg, rgba(10,8,15,0.55), rgba(10,8,15,0.42));
					border-radius: 12px;
					border: 1px solid rgba(139,40,255,0.22);
					box-shadow: 0 10px 26px rgba(139,40,255,0.08), 0 0 18px rgba(139,40,255,0.07) inset;
					transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
				}
				.lb-card:hover {
					transform: translateY(-3px);
					box-shadow: 0 18px 46px rgba(139,40,255,0.16), 0 0 26px rgba(139,40,255,0.14) inset;
					border-color: rgba(139,40,255,0.36);
				}
				.rank {
					font-weight: 900;
					font-size: 18px;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.medal {
					font-size: 20px;
				}
				.avatar {
					width: 36px; height: 36px; border-radius: 50%;
					background: linear-gradient(135deg, #7c3aed, #06b6d4);
					display: inline-flex; align-items: center; justify-content: center;
					color: #fff; font-weight: 900;
					box-shadow: 0 0 0 2px rgba(255,255,255,0.06) inset;
					margin-right: 10px;
				}
				.player {
					display: flex; align-items: center;
					font-weight: 800; letter-spacing: .2px;
				}
				.score-wrap {
					display: flex; flex-direction: column; gap: 6px;
				}
				.score-bar {
					height: 8px; border-radius: 999px; overflow: hidden;
					background: rgba(139,40,255,0.12);
					box-shadow: 0 0 0 1px rgba(139,40,255,0.12) inset;
				}
				.score-bar > span {
					display: block; height: 100%;
					background: linear-gradient(90deg,#7c3aed,#06b6d4);
				}
				.chips {
					display: flex; gap: 6px; flex-wrap: wrap; opacity: .95;
				}
				.chip {
					font-size: 12px; padding: 4px 8px; border-radius: 999px;
					background: rgba(139,40,255,0.10); border: 1px solid rgba(139,40,255,0.22);
				}
				.header {
					background: rgba(10,8,15,0.36);
					border: 1px solid rgba(124,58,237,0.06);
					padding: 12px; color: #fff;
					position: sticky; top: 12px; z-index: 6;
					backdrop-filter: blur(6px);
					border-radius: 12px;
				}
				.header-grid {
					display: grid;
					grid-template-columns: 80px 1.2fr 1.2fr 110px 100px 260px 170px;
					gap: 10px; padding: 6px 8px; font-weight: 800;
				}
				.empty {
					display: flex; flex-direction: column; align-items: center; justify-content: center;
					padding: 40px; border: 1px dashed rgba(255,255,255,0.14);
					border-radius: 12px; background: rgba(10,8,15,0.3);
				}
			`}</style>

			<div style={{ padding: 30, paddingTop: 50, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18, position: "relative", zIndex: 1 }}>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ width: "100%", maxWidth: 1600, display: "flex", flexDirection: "column", gap: 16 }}>
						<div>
							<h2 style={{ margin: 30, fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "0 0 12px rgba(124,58,237,0.18)" }}>
								Leaderboard
							</h2>
							<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700, opacity: 0.95, fontSize: 16 }}>Top players and their stats</p>
						</div>

						{/* Filters */}
						<div className="lb-toolbar">
							<TextField
								variant="outlined"
								placeholder="Search player"
								size="small"
								value={search}
								onChange={(e) => { setSearch(e.target.value); setPage(1); }}
								InputProps={{ sx: { background: "rgba(139,40,255,0.06)", color: "#fff", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" } }}
							/>

							<FormControl size="small">
								<InputLabel sx={{ color: "#ddd" }}>Region</InputLabel>
								<Select
									label="Region"
									value={region}
									onChange={(e) => { setRegion(e.target.value); setPage(1); }}
									sx={{ color: "#fff", background: "rgba(139,40,255,0.06)", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" }}
								>
									{regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
								</Select>
							</FormControl>

							<FormControl size="small">
								<InputLabel sx={{ color: "#ddd" }}>Car Pack</InputLabel>
								<Select
									label="Car Pack"
									value={carPack}
									onChange={(e) => { setCarPack(e.target.value); setPage(1); }}
									sx={{ color: "#fff", background: "rgba(139,40,255,0.06)", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" }}
								>
									{carPacks.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
								</Select>
							</FormControl>

							<FormControl size="small">
								<InputLabel sx={{ color: "#ddd" }}>Map</InputLabel>
								<Select
									label="Map"
									value={map}
									onChange={(e) => { setMap(e.target.value); setPage(1); }}
									sx={{ color: "#fff", background: "rgba(139,40,255,0.06)", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" }}
								>
									{maps.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
								</Select>
							</FormControl>

							<ToggleButtonGroup
								color="primary"
								value={range}
								exclusive
								onChange={(_, v) => { if (v) { setRange(v); setPage(1); void loadData(); } }}
								size="small"
							>
								<ToggleButton value="24h">24h</ToggleButton>
								<ToggleButton value="7d">7d</ToggleButton>
								<ToggleButton value="30d">30d</ToggleButton>
								<ToggleButton value="all">All</ToggleButton>
							</ToggleButtonGroup>

							<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
								<Button variant="outlined" onClick={resetFilters} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.14)" }}>Reset</Button>
								<Button variant="contained" onClick={() => void loadData()} sx={{ background: "#8b28ff" }}>Refresh</Button>
							</div>
						</div>

						{/* Table header */}
						<div className="header">
							<div className="header-grid">
								<div>#</div>
								<div style={{ cursor: "pointer" }} onClick={() => toggleSort("player")}>Player {orderBy === "player" ? (orderDir === "asc" ? "▲" : "▼") : null}</div>
								<div style={{ cursor: "pointer" }} onClick={() => toggleSort("score")}>Score {orderBy === "score" ? (orderDir === "asc" ? "▲" : "▼") : null}</div>
								<div>Wins</div>
								<div>Laps</div>
								<div>Context</div>
								<div style={{ cursor: "pointer" }} onClick={() => toggleSort("lastSeen")}>Last Seen {orderBy === "lastSeen" ? (orderDir === "asc" ? "▲" : "▼") : null}</div>
							</div>
						</div>

						{/* Table body */}
						<div>
							{loading ? (
								// Skeleton rows (no preset results)
								Array.from({ length: 8 }).map((_, i) => (
									<div key={i} className="lb-card">
										<Skeleton variant="text" width={50} height={26} />
										<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
											<Skeleton variant="circular" width={36} height={36} />
											<Skeleton variant="text" width={160} height={24} />
										</div>
										<div className="score-wrap">
											<Skeleton variant="text" width={120} height={22} />
											<Skeleton variant="rectangular" height={8} />
										</div>
										<Skeleton variant="text" width={50} height={22} />
										<Skeleton variant="text" width={50} height={22} />
										<div style={{ display: "flex", gap: 6 }}>
											<Skeleton variant="rounded" width={80} height={24} />
											<Skeleton variant="rounded" width={100} height={24} />
											<Skeleton variant="rounded" width={120} height={24} />
										</div>
										<Skeleton variant="text" width={160} height={22} />
									</div>
								))
							) : error ? (
								<div className="empty" style={{ borderColor: "rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.06)" }}>
									<strong style={{ fontSize: 18, marginBottom: 8 }}>Couldn't load leaderboard</strong>
									<div style={{ opacity: 0.9, marginBottom: 12 }}>{error}</div>
									<Button variant="contained" onClick={() => void loadData()} sx={{ background: "#ef4444" }}>Retry</Button>
								</div>
							) : pageItems.length === 0 ? (
								<div className="empty">
									<strong style={{ fontSize: 18, marginBottom: 8 }}>No results</strong>
									<div style={{ opacity: 0.9, marginBottom: 12 }}>Adjust filters or try a different date range.</div>
									<div style={{ display: "flex", gap: 8 }}>
										<Button variant="outlined" onClick={resetFilters} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.14)" }}>Clear Filters</Button>
										<Button variant="contained" onClick={() => void loadData()} sx={{ background: "#8b28ff" }}>Refresh</Button>
									</div>
								</div>
							) : (
								pageItems.map((e, idx) => {
									const rank = (page - 1) * PAGE_SIZE + idx + 1;
									const m = medal(rank);
									const pct = Math.round(((e.score ?? 0) / maxScore) * 100);
									return (
										<div key={e.id} className="lb-card">
											<div className="rank">
												{m ? <span className="medal" aria-hidden="true">{m}</span> : null}
												<span>{rank}</span>
											</div>

											<div className="player">
												<span className="avatar">{initials(e.player)}</span>
												<span>{e.player}</span>
											</div>

											<div className="score-wrap">
												<div style={{ fontWeight: 900 }}>{(e.score ?? 0).toLocaleString()}</div>
												<div className="score-bar" aria-label={`Score ${pct}% of top`}>
													<span style={{ width: `${pct}%` }} />
												</div>
											</div>

											<div style={{ fontWeight: 800 }}>{e.wins ?? "—"}</div>
											<div style={{ fontWeight: 700 }}>{e.laps ?? "—"}</div>

											<div className="chips">
												{e.region && <span className="chip">{e.region}</span>}
												{e.carPack && <span className="chip">{e.carPack}</span>}
												{e.map && <span className="chip">{e.map}</span>}
											</div>

											<div style={{ opacity: 0.9 }}>{e.lastSeen ? new Date(e.lastSeen).toLocaleString() : "—"}</div>
										</div>
									);
								})
							)}
						</div>

						{/* Pagination */}
						{!loading && (
							<div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
								<Pagination
									count={pageCount}
									page={page}
									onChange={(_, v) => setPage(v)}
									color="primary"
									siblingCount={1}
									boundaryCount={1}
									showFirstButton
									showLastButton
									sx={{ "& .MuiPaginationItem-root": { color: "#fff" }, "& .Mui-selected": { background: "#7c3aed" } }}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}
