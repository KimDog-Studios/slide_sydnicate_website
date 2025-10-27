"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Pagination from "@mui/material/Pagination"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import IconButton from "@mui/material/IconButton"
import Divider from "@mui/material/Divider"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormGroup from "@mui/material/FormGroup"
import SearchIcon from "@mui/icons-material/Search"
import SortIcon from "@mui/icons-material/Sort"
import FilterListIcon from "@mui/icons-material/FilterList"
import RefreshIcon from "@mui/icons-material/Refresh"
import PeopleIcon from "@mui/icons-material/People"
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar"
import PublicIcon from "@mui/icons-material/Public"
import MapIcon from "@mui/icons-material/Map"
import TrafficIcon from "@mui/icons-material/Traffic"
import CloseIcon from "@mui/icons-material/Close"

// config
import { DEFAULT_IP, SERVERS, type Server } from "./config"

type OrderKey = "name" | "tier" | "region" | "carPack" | "players" | "trafficDensity" | "map"

const VIDEO_SRC = "/videos/bg.mp4"

// small helper to map tier names/aliases to display label + colors (drifting-themed)
const getTierMeta = (t?: string | null) => {
	const k = (t ?? "").toLowerCase().trim();
	// Drifting tiers (with legacy aliases)
	if (["tier 0", "public", "beginner access", "beginner"].includes(k))
		return { label: "Beginner Access", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
	if (["tier 1", "public+", "streetline", "street"].includes(k))
		return { label: "Streetline", gradient: "linear-gradient(90deg,#3b82f6,#06b6d4)" };
	if (["tier 2", "midnight", "tandem club", "tandem"].includes(k))
		return { label: "Tandem Club", gradient: "linear-gradient(90deg,#a855f7,#f59e0b)" };
	if (["tier 3", "underground", "pro line", "proline", "pro"].includes(k))
		return { label: "Pro Line", gradient: "linear-gradient(90deg,#ff3d6e,#ff8c42)" };

	// Legacy metals (kept for compatibility)
	if (k === "bronze") return { label: "Bronze", gradient: "linear-gradient(90deg,#7c3a00,#b7791f)" };
	if (k === "silver") return { label: "Silver", gradient: "linear-gradient(90deg,#64748b,#94a3b8)" };
	if (k === "gold") return { label: "Gold", gradient: "linear-gradient(90deg,#b45309,#f59e0b)" };
	if (k === "platinum") return { label: "Platinum", gradient: "linear-gradient(90deg,#0ea5a4,#06b6d4)" };

	// Fallback (public/default)
	return { label: t ?? "Public", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
};
const tierLabel = (t?: string | null) => getTierMeta(t).label;
const tierColor = (t?: string | null) => getTierMeta(t).gradient;

export default function page() {
	// UI state
	const [searchInput, setSearchInput] = useState("")
	const [searchName, setSearchName] = useState("")
	const [tier, setTier] = useState<string>("All")
	const [region, setRegion] = useState<string>("All")
	const [minPlayers, setMinPlayers] = useState<number>(0)
	const [maxPlayers, setMaxPlayers] = useState<number>(32)
	const [selectedCarPacks, setSelectedCarPacks] = useState<Set<string>>(new Set())
	const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set())
	const [selectedTraffic, setSelectedTraffic] = useState<Set<string>>(new Set())
	// modal flag for filter panel
	const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false)
	// sorting state (was missing — required by handleSort/displayed)
	const [orderBy, setOrderBy] = useState<OrderKey>("name")
	const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc")
	// pagination & refresh
	const [page, setPage] = useState<number>(1)
	const PAGE_SIZE = 10
	const [secondsLeft, setSecondsLeft] = useState<number>(60)
	const [isFetching, setIsFetching] = useState<boolean>(true)
	const [refreshKey, setRefreshKey] = useState<number>(0)

	// live counts cache
	const [serverCounts, setServerCounts] = useState<Record<string, { players: number; maxPlayers: number }>>({})

	// track recent changes to highlight rows briefly
	const prevCountsRef = useRef<Record<string, { players: number; maxPlayers: number }> | null>(null)
	const [changedIds, setChangedIds] = useState<Set<string>>(new Set())

	// Join modal state & countdown (now includes server id and metadata)
	const [joinModalOpen, setJoinModalOpen] = useState(false)
	const [joinInfo, setJoinInfo] = useState<{
		id?: string
		url: string
		name: string
		thumbnail?: string
		carPack?: string | null
		region?: string | null
		tier?: string | null
	} | null>(null)
	const [joinCountdown, setJoinCountdown] = useState<number>(5)
	const joinTimerRef = useRef<number | null>(null)
	// remember initial join duration so progress mirrors the server timer (decreasing)
	const joinInitialRef = useRef<number>(5)

	// open with full server object so modal can show thumbnail/tier/carpack/region
	const openJoinModal = (server: Server, url: string, seconds = 5) => {
		joinInitialRef.current = seconds
		setJoinInfo({
			id: server.id,
			name: server.name,
			url,
			thumbnail: server.thumbnail,
			carPack: server.carPack ?? "Default Pack",
			region: server.region,
			tier: server.tier,
		})
		setJoinCountdown(seconds)
		setJoinModalOpen(true)
	}

	const closeJoinModal = () => {
		setJoinModalOpen(false)
		setJoinInfo(null)
		setJoinCountdown(5)
		if (joinTimerRef.current) {
			clearInterval(joinTimerRef.current)
			joinTimerRef.current = null
		}
	}

	// start countdown and open join URL in a new tab when it hits zero
	useEffect(() => {
		if (!joinModalOpen || !joinInfo) return
		// ensure any previous timer cleared
		if (joinTimerRef.current) {
			clearInterval(joinTimerRef.current)
			joinTimerRef.current = null
		}
		joinTimerRef.current = window.setInterval(() => {
			setJoinCountdown((c) => {
				if (c <= 1) {
					if (joinTimerRef.current) {
						clearInterval(joinTimerRef.current)
						joinTimerRef.current = null
					}
					// open in a new tab and close modal
					if (joinInfo?.url) window.open(joinInfo.url, "_blank", "noopener,noreferrer")
					closeJoinModal()
					return 0
				}
				return c - 1
			})
		}, 1000)
		return () => {
			if (joinTimerRef.current) {
				clearInterval(joinTimerRef.current)
				joinTimerRef.current = null
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [joinModalOpen, joinInfo])

	// debounce searchInput -> searchName
	useEffect(() => {
		const t = setTimeout(() => setSearchName(searchInput), 500)
		return () => clearTimeout(t)
	}, [searchInput])

	// fetch with timeout helper
	const fetchWithTimeout = async (url: string, timeout = 2000) => {
		const controller = new AbortController()
		const id = setTimeout(() => controller.abort(), timeout)
		try {
			const res = await fetch(url, { signal: controller.signal })
			clearTimeout(id)
			return res
		} catch (err) {
			clearTimeout(id)
			throw err
		}
	}

	// helper: promise with timeout (fail-fast to avoid UI getting stuck)
	const promiseWithTimeout = async <T,>(p: Promise<T>, ms = 8000): Promise<T> => {
		let id: ReturnType<typeof setTimeout> | null = null
		const timeout = new Promise<never>((_, rej) => {
			id = setTimeout(() => rej(new Error("timeout")), ms)
		})
		try {
			return await Promise.race([p, timeout]) as T
		} finally {
			if (id) clearTimeout(id)
		}
	}

	// probe server for counts (speed-optimized)
	const fetchServerCount = async (s: Server, perRequestTimeout = 900) => {
		// only try the primary fast HTTP endpoints — skip slower HTTPS probes
		const tryUrls = [
			`http://${DEFAULT_IP}:${s.httpPort}/status`,
			`http://${DEFAULT_IP}:${s.httpPort}/players.json`,
		]
		for (const url of tryUrls) {
			try {
				const res = await fetchWithTimeout(url, perRequestTimeout)
				if (!res.ok) continue
				const json = await res.json().catch(() => null)
				if (!json) continue
				const p =
					(typeof json.players === "number" && json.players) ||
					(typeof json.currentPlayers === "number" && json.currentPlayers) ||
					(typeof json.playersCount === "number" && json.playersCount) ||
					(typeof json.playerCount === "number" && json.playerCount) ||
					(Array.isArray(json.players_list) && json.players_list.length) ||
					undefined
				const m =
					(typeof json.maxPlayers === "number" && json.maxPlayers) ||
					(typeof json.max === "number" && json.max) ||
					(typeof json.max_players === "number" && json.max_players) ||
					(typeof s.maxPlayers === "number" && s.maxPlayers)
				if (typeof p === "number" && typeof m === "number") return { players: p, maxPlayers: m }
			} catch {
				/* ignore and try next */
			}
		}
		return undefined
	}

	// fetch counts for list of servers with limited concurrency
	const fetchCountsForServers = async (servers: Server[], opts?: { concurrency?: number; perRequestTimeout?: number }) => {
		const results: Record<string, { players: number; maxPlayers: number }> = {}
		const concurrency = opts?.concurrency ?? 12
		const perRequestTimeout = opts?.perRequestTimeout ?? 900
		let idx = 0
		const workers = Array.from({ length: concurrency }).map(async () => {
			while (true) {
				const i = idx++
				if (i >= servers.length) break
				const s = servers[i]
				try {
					const data = await fetchServerCount(s, perRequestTimeout)
					if (data) results[s.id] = data
				} catch {
					// ignore per-server errors
				}
			}
		})
		await Promise.all(workers)
		setServerCounts((prev) => ({ ...prev, ...results }))
	}

	// initial fetch on mount
	useEffect(() => {
		let mounted = true
		;(async () => {
			if (!mounted) return
			setIsFetching(true)
			try {
				// fast foreground: fetch only the first page (very parallel) and wait a short time
				const firstBatch = SERVERS.slice(0, PAGE_SIZE)
				await promiseWithTimeout(fetchCountsForServers(firstBatch, { concurrency: 12, perRequestTimeout: 900 }), 4000)
				// fire-and-forget: background refresh for the remainder with lower concurrency
				fetchCountsForServers(SERVERS.slice(PAGE_SIZE), { concurrency: 6, perRequestTimeout: 900 }).catch(() => {})
			} catch {
				// ignore timeouts / errors — we'll still show any partial data
			} finally {
				// short delay so users see banner briefly
				setTimeout(() => setIsFetching(false), 250)
			}
		})()
		return () => {
			mounted = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// auto-refresh countdown
	useEffect(() => {
		if (isFetching) return
		const id = setInterval(() => {
			setSecondsLeft((s) => {
				if (s <= 1) {
					// start refresh
					setIsFetching(true)
					;(async () => {
						try {
							// fast refresh for first page, then background for rest
							const firstBatch = SERVERS.slice(0, PAGE_SIZE)
							await promiseWithTimeout(fetchCountsForServers(firstBatch, { concurrency: 12, perRequestTimeout: 900 }), 4000)
							fetchCountsForServers(SERVERS.slice(PAGE_SIZE), { concurrency: 6, perRequestTimeout: 900 }).catch(() => {})
						} catch {
							// ignore timeout / errors
						} finally {
							setIsFetching(false)
							setSecondsLeft(60)
							setRefreshKey((k) => k + 1)
						}
					})()
					return 60
				}
				return s - 1
			})
		}, 1000)
		return () => clearInterval(id)
	}, [isFetching])

	// filtered list
	const filtered = useMemo(() => {
		return SERVERS.filter((s) => {
			if (searchName && !s.name.toLowerCase().includes(searchName.toLowerCase())) return false
			if (tier !== "All" && s.tier !== tier) return false
			if (region !== "All" && s.region !== region) return false
			if (s.players < minPlayers) return false
			if (s.players > maxPlayers) return false
			if (selectedTraffic.size > 0 && !selectedTraffic.has(s.trafficDensity)) return false
			const carPackKey = s.carPack ?? "Default"
			if (selectedCarPacks.size > 0 && !selectedCarPacks.has(carPackKey)) return false
			if (selectedMaps.size > 0 && !selectedMaps.has(s.map)) return false
			return true
		})
	}, [searchName, tier, region, minPlayers, maxPlayers, selectedTraffic, selectedCarPacks, selectedMaps])

	// sorting + displayed + pagination
	const displayed = useMemo(() => {
		const arr = [...filtered]
		arr.sort((a, b) => {
			let cmp = 0
			if (orderBy === "players") {
				const pa = serverCounts[a.id]?.players ?? a.players ?? 0
				const pb = serverCounts[b.id]?.players ?? b.players ?? 0
				cmp = pa - pb
			} else {
				// normalize values to strings for comparison
				const va = String(orderBy === "carPack" ? (a.carPack ?? "Default") : (a as any)[orderBy] ?? "").toLowerCase()
				const vb = String(orderBy === "carPack" ? (b.carPack ?? "Default") : (b as any)[orderBy] ?? "").toLowerCase()
				cmp = va < vb ? -1 : va > vb ? 1 : 0
			}
			// stable tie-breaker by name
			if (cmp === 0) cmp = a.name.localeCompare(b.name)
			return orderDirection === "asc" ? cmp : -cmp
		})
		return arr
	}, [filtered, orderBy, orderDirection, serverCounts])

	const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
	const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	// keep current page within bounds when the number of pages changes (prevents jumping to page 1 on refresh)
	useEffect(() => {
		if (page > pageCount) setPage(pageCount)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageCount])

	// reset page when filters change
	useEffect(() => setPage(1), [searchName, tier, region, minPlayers, maxPlayers, selectedCarPacks, selectedMaps, selectedTraffic])

	// helper: toggle item in Set state
	const toggleSetValue = (current: Set<string>, val: string, setter: (s: Set<string>) => void) => {
		const copy = new Set(current)
		if (copy.has(val)) copy.delete(val)
		else copy.add(val)
		setter(copy)
	}

	// available filter options derived from SERVERS
	const TIERS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.tier))).sort(), [])
	const REGIONS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.region))).sort(), [])
	const CARPACKS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.carPack ?? "Default"))).sort(), [])
	const TRAFFICS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.trafficDensity))).sort(), [])
	// MAPS list used by the Map filter card
	const MAPS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.map))).sort(), [])

	// open/close handlers for filter modal
	const openFilter = (_e?: React.MouseEvent<HTMLElement>) => setFilterModalOpen(true)
	const closeFilter = () => setFilterModalOpen(false)

	// modal actions
	const clearFiltersInModal = () => {
		setSelectedCarPacks(new Set())
		setSelectedMaps(new Set())
		setSelectedTraffic(new Set())
		setTier("All")
		setRegion("All")
		setMinPlayers(0)
		setMaxPlayers(32)
	}
	const applyFilters = () => {
		// currently filters are applied live; just close the modal
		closeFilter()
	}

	// UI helpers
	const resetAll = () => {
		setSearchInput("")
		setSearchName("")
		setTier("All")
		setRegion("All")
		setSelectedCarPacks(new Set())
		setSelectedMaps(new Set())
		setSelectedTraffic(new Set())
		setMinPlayers(0)
		setMaxPlayers(32)
		setPage(1)
	}

	// sort handler for headers
	const handleSort = (key: OrderKey) => {
		if (key === orderBy) {
			setOrderDirection((d) => (d === "asc" ? "desc" : "asc"))
		} else {
			setOrderBy(key)
			setOrderDirection("asc")
		}
	}

	// manual refresh (fast-first-batch then background)
	const refreshNow = async () => {
		if (isFetching) return
		setIsFetching(true)
		try {
			const firstBatch = SERVERS.slice(0, PAGE_SIZE)
			await promiseWithTimeout(fetchCountsForServers(firstBatch, { concurrency: 12, perRequestTimeout: 900 }), 4000)
			// background fetch remaining servers
			fetchCountsForServers(SERVERS.slice(PAGE_SIZE), { concurrency: 6, perRequestTimeout: 900 }).catch(() => {})
		} catch {
			// ignore timeouts / errors
		} finally {
			setIsFetching(false)
			setSecondsLeft(60)
			setRefreshKey((k) => k + 1)
		}
	}

	return (
		<React.Fragment>
			<div>
				{/* Fullscreen background video (muted, autoplay, loop, no controls) */}
				<video
					aria-hidden="true"
					src={VIDEO_SRC}
					autoPlay
					muted
					loop
					playsInline
					preload="auto"
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100vw",
						height: "100vh",
						objectFit: "cover",
						zIndex: 0,
						border: 0,
						pointerEvents: "none",
					}}
				/>
			</div>
			<div style={{ padding: 30, paddingTop: 50, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18, position: "relative", zIndex: 1 }}>
				{/* heading + toolbar */}
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ width: "100%", maxWidth: 1600, display: "flex", flexDirection: "column", gap: 16 }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "0 0 12px rgba(124,58,237,0.18)" }}>Servers</h2>
							<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700, opacity: 0.95, fontSize: 16 }}>Browse and filter available servers</p>
						</div>

						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
							<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1, background: "rgba(0,0,0,0.45)", p: "4px 8px", borderRadius: 1 }}>
									<SearchIcon sx={{ color: "#fff" }} />
									<TextField
										variant="standard"
										placeholder="Search server name..."
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										size="small"
										disabled={isFetching}
										InputProps={{ disableUnderline: true, sx: { color: "#fff" } }}
										sx={{ minWidth: 220 }}
									/>
								</Box>

								{/* Sort removed — results are alphabetical. Filter opens a popover */}
								<Button size="small" variant="outlined" onClick={openFilter} startIcon={<FilterListIcon />} disabled={isFetching} sx={{ color: "#fff" }}>
									Filter By
								</Button>
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
								<Button size="small" variant="outlined" onClick={refreshNow} startIcon={<RefreshIcon />} disabled={isFetching} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.06)" }}>
									Refresh Now
								</Button>

								<Button size="small" variant="contained" onClick={resetAll} startIcon={<RefreshIcon />} disabled={isFetching} sx={{ background: "#7c3aed" }}>
									Reset Filters
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* timer + banner */}
				<div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 1600, margin: "0 auto", width: "100%", padding: "2 8px" }}>
					<div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
						<div style={{ height: "100%", width: `${(secondsLeft / 60) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", transition: "width 0.9s linear" }} />
					</div>

					{/* Show Next refresh, player count (left) and servers found (right) */}
					<div style={{ minWidth: 260, textAlign: "right", fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
						{isFetching ? (
							<span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
								<svg width="20" height="20" viewBox="0 0 24 24"><g><path fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" d="M12 2 A10 10 0 0 1 22 12" /><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" /></g></svg>
								<span style={{ fontSize: 13 }}>Fetching servers — updating list</span>
							</span>
						) : (
							<span>Next refresh: {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span>
						)}
						{/* Row: player count (left) + servers found (right) */}
						<div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
							{/* animated green circle with total players */}
							{/* inline styles for smaller animated badge */}
							<style>{`
								@keyframes pc-pulse {
									0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); transform: scale(1); }
									70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); transform: scale(1.04); }
									100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); transform: scale(1); }
								}
								.pc-circle {
									width: 28px;
									height: 28px;
									border-radius: 50%;
									display: inline-flex;
									align-items: center;
									justify-content: center;
									background: linear-gradient(135deg,#10b981,#059669);
									color: #fff;
									font-weight: 900;
									font-size: 11px;
									box-shadow: 0 6px 14px rgba(16,185,129,0.14), inset 0 1px 0 rgba(255,255,255,0.04);
									animation: pc-pulse 1.8s infinite ease-out;
									line-height: 1;
								}
							`}</style>

							{/* Player counter component — use local proxy to avoid direct cross-origin probes */}
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<div className="pc-circle">0</div>
								<div style={{ fontSize: 13, opacity: 0.85, fontWeight: 800 }}>Players Online</div>
							</div>

							<div style={{ fontWeight: 800, fontSize: 13 }}>
								{isFetching ? " " : `${filtered.length} server${filtered.length !== 1 ? "s" : ""} found`}
							</div>
						</div>
					</div>
				</div>

				{isFetching && (
					<div style={{ maxWidth: 1600, margin: "6px auto 0", padding: "8px", background: "#2a0b51", color: "#fff", borderRadius: 8, fontWeight: 900, textAlign: "center" }}>
						Refreshing server list — please wait
					</div>
				)}

				{/* table header + rows */}
				<div style={{ width: "100%", maxWidth: 1600, margin: "0 auto", position: "relative" }}>
					{/* header */}
					{/* sticky header so users keep context while scrolling */}
					<div style={{ background: "rgba(10,8,15,0.36)", border: "1px solid rgba(124,58,237,0.06)", padding: 12, color: "#fff", position: "sticky", top: 12, zIndex: 6, backdropFilter: "blur(6px)" }}>
						<div style={{ display: "grid", gridTemplateColumns: "360px 180px 140px 180px 140px 140px 220px 140px", gap: 8, padding: "8px 12px", fontWeight: 800 }}>
							{/* clickable headers */}
							<div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => handleSort("name")}>
								Server Name {orderBy === "name" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>
							<div style={{ cursor: "pointer" }} onClick={() => handleSort("tier")}>
								Tier {orderBy === "tier" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("region")}>
								Region {orderBy === "region" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("carPack")}>
								Car Pack {orderBy === "carPack" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("players")}>
								Players {orderBy === "players" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("trafficDensity")}>
								Traffic {orderBy === "trafficDensity" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("map")}>
								Map {orderBy === "map" ? (orderDirection === "asc" ? "▲" : "▼") : null}
							</div>

							<div style={{ textAlign: "right" }}>Action</div>
						</div>
					</div>

					{/* body */}
					<div>
						{isFetching ? (
							<div role="row" style={{ display: "grid", gridTemplateColumns: "360px 180px 140px 180px 140px 140px 220px 140px", padding: 28, minHeight: 120, borderBottom: "1px solid rgba(255,255,255,0.03)", textAlign: "center", color: "rgba(255,255,255,0.9)", fontWeight: 900 }}>
								<div style={{ gridColumn: "1 / -1" }}>Fetching servers — table temporarily empty</div>
							</div>
						) : paginated.length === 0 ? (
							<div style={{ padding: 28, textAlign: "center", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>No servers found — try adjusting filters</div>
						) : (
							<>
								{/* Server card styles for improved spacing & neon outline */}
								<style>{`
 									.server-card {
 										display: grid;
 										grid-template-columns: 360px 180px 140px 180px 140px 140px 220px 140px;
 										align-items: center;
 										gap: 8px;
 										padding: 14px;
 										margin-bottom: 12px;
 										background: rgba(10,8,15,0.45);
 										border-radius: 12px;
 										border: 1px solid rgba(139,40,255,0.22);
 										box-shadow: 0 8px 30px rgba(139,40,255,0.06), 0 0 18px rgba(139,40,255,0.06) inset;
 										transition: transform 0.14s ease, box-shadow 0.14s ease;
 									}
 									.server-card:hover {
 										transform: translateY(-4px);
 										box-shadow: 0 18px 50px rgba(139,40,255,0.12), 0 0 28px rgba(139,40,255,0.12) inset;
 									}
 									/* briefly pulse background when player count changes */
 									.server-card.changed {
 										animation: row-flash 2.2s ease;
 										box-shadow: 0 20px 48px rgba(124,58,237,0.12), 0 0 24px rgba(124,58,237,0.06) inset;
 									}
 									@keyframes row-flash {
 										0% { background: linear-gradient(90deg, rgba(34,197,94,0.12), rgba(124,58,237,0.06)); transform: translateY(-2px); }
 										40% { background: rgba(10,8,15,0.62); transform: translateY(0); }
 										100% { background: rgba(10,8,15,0.45); transform: translateY(0); }
 									}
 								`}</style>

								{paginated.map((s: Server) => {
									const joinUrl = `https://acstuff.ru/s/q:race/online/join?ip=${encodeURIComponent(DEFAULT_IP)}&httpPort=${encodeURIComponent(String(s.httpPort))}`
									const live = serverCounts[s.id]
									return (
 										<div key={s.id} role="row" className={`server-card${changedIds.has(s.id) ? " changed" : ""}`}>
 											<div style={{ minWidth: 0 }}>
 												<div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
 													{ s.thumbnail ? <img src={s.thumbnail} alt={s.name} style={{ width: 80, height: 48, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 80, height: 48, background: "linear-gradient(90deg,#0f172a,#24123b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", borderRadius: 6 }}>{s.map.split(" ").slice(0,2).map((w:string)=>w[0] ?? "").join("")}</div> }
 													<div style={{ minWidth: 0, overflow: "hidden" }}>
 														<div style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
 														<div style={{ fontSize: 13, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.map}</div>
 													</div>
 												</div>
 											</div>

 											{/* tier pill (no truncation) */}
 											<div style={{ whiteSpace: "nowrap" }}>
 												<span
 													style={{
 														display: "inline-block",
 														padding: "6px 10px",
 														borderRadius: 999,
 														background: tierColor(s.tier),
 														color: "#fff",
 														fontWeight: 800,
 														fontSize: 13,
 													}}
 												>
 													{tierLabel(s.tier)}
 												</span>
 											</div>

 											<div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}><PublicIcon fontSize="small" />{s.region}</div>

 											<div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}><DirectionsCarIcon fontSize="small" />{s.carPack ?? "Default Pack"}</div>

 											<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><PeopleIcon fontSize="small" style={{ marginRight: 6 }} />{live ? `${live.players}/${live.maxPlayers}` : `${s.players}/${s.maxPlayers}`}</div>

 											<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><TrafficIcon fontSize="small" style={{ marginRight: 6 }} />{s.trafficDensity}</div>

 											<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><MapIcon fontSize="small" style={{ marginRight: 6 }} />{s.map}</div>

 											<div style={{ textAlign: "right" }}>
 												<Button size="small" onClick={() => openJoinModal(s, joinUrl, 5)} disabled={isFetching} sx={{ padding: "6px 12px", borderRadius: 1, background: "#7c3aed", color: "#fff", fontWeight: 800, textTransform: "none" }}>
 													Join
 												</Button>
 											</div>
 										</div>
 									)
 								})}
							</>
						)}
					</div>

					{/* pagination */}
					{!isFetching && (
						<div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
							<Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="primary" siblingCount={1} boundaryCount={1} showFirstButton showLastButton sx={{ "& .MuiPaginationItem-root": { color: "#fff" }, "& .Mui-selected": { background: "#7c3aed" } }} />
						</div>
					)}
				</div>

				{/* Filter modal (centered panel matching the provided design) */}
				<Dialog
					open={filterModalOpen}
					onClose={closeFilter}
					maxWidth="md"
					fullWidth
					BackdropProps={{ sx: { backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" } }}
					PaperProps={{
 						sx: {
 						// smaller, centered panel
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
 				{/* Header with large title and close button */}
 				<div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 					<strong style={{ fontSize: 34, letterSpacing: 1, fontWeight: 900 }}>FILTER</strong>
 					<IconButton onClick={closeFilter} sx={{ color: "#fff" }}>
 						<CloseIcon />
 					</IconButton>
 				</div>

 				{/* Search bar */}
 				<div style={{ padding: "0 24px 18px 24px" }}>
 					<TextField
 						variant="outlined"
 						placeholder="Search Filters"
 						fullWidth
 						size="small"
 						InputProps={{ sx: { background: "rgba(139,40,255,0.06)", color: "#fff", borderRadius: 1, border: "1px solid rgba(139,40,255,0.18)" } }}
 					/>
 				</div>

 				<Divider sx={{ borderColor: "rgba(255,255,255,0.04)" }} />

 				{/* Content grid (two columns where space allows) */}
 				<DialogContent sx={{ px: 3, py: 2 }}>
 					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
 						{/* Region (single-select buttons) */}
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

 						{/* Traffic */}
 						<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
 							<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Traffic Density</div>
 							<FormGroup>
 								{TRAFFICS.map((t) => (
 									<FormControlLabel key={t} control={<Checkbox checked={selectedTraffic.has(t)} onChange={() => toggleSetValue(selectedTraffic, t, setSelectedTraffic)} sx={{ color: "rgba(139,40,255,0.9)" }} />} label={t} />
 								))}
 							</FormGroup>
 						</div>

 						{/* Tier */}
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

 						{/* Car Packs */}
 						<div style={{ padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
 							<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Car Packs</div>
 							<FormGroup>
 								{CARPACKS.map((c) => (
 									<FormControlLabel key={c} control={<Checkbox checked={selectedCarPacks.has(c)} onChange={() => toggleSetValue(selectedCarPacks, c, setSelectedCarPacks)} sx={{ color: "rgba(139,40,255,0.9)" }} />} label={c} />
 								))}
 							</FormGroup>
 						</div>

 						{/* Map (multi-select) — show checkboxes in two columns and span full modal width */}
 						<div style={{ gridColumn: "1 / -1", padding: 14, borderRadius: 10, background: "rgba(139,40,255,0.06)", border: "1px solid rgba(139,40,255,0.22)", boxShadow: "0 8px 20px rgba(139,40,255,0.04)" }}>
 							<div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Map</div>
 							<FormGroup sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
 								{MAPS.map((m) => (
 									<FormControlLabel
 										key={m}
 										control={<Checkbox checked={selectedMaps.has(m)} onChange={() => toggleSetValue(selectedMaps, m, setSelectedMaps)} sx={{ color: "rgba(139,40,255,0.9)" }} />}
 										label={m}
 										sx={{ width: "100%", mr: 0, mb: 0.5 }}
 									/>
 								))}
 							</FormGroup>
 						</div>
 					</div>
 				</DialogContent>

 				{/* Sticky-looking bottom action bar */}
 				<DialogActions sx={{ p: 2, justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.04)", bgcolor: "rgba(0,0,0,0.6)" }}>
 					<Button variant="outlined" onClick={clearFiltersInModal} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}>
 						CLEAR FILTER
 					</Button>
 					<Button variant="contained" onClick={applyFilters} sx={{ background: "#8b28ff" }}>
 						APPLY
 					</Button>
 				</DialogActions>
 			</Dialog>

			{/* Join modal (improved layout, neon accents) */}
			<Dialog
				open={joinModalOpen}
				onClose={closeJoinModal}
				// wider breakpoint to reduce horizontal overflow
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						// responsive explicit width so it never forces page scrollbar
						width: "min(900px, 94vw)",
						bgcolor: "rgba(10,8,16,0.62)", // translucent for frosted effect
						backdropFilter: "blur(8px) saturate(120%)",
						color: "#fff",
						px: 3,
						pt: 2.5,
						pb: 2,
						borderRadius: 2,
						border: "1px solid rgba(124,58,237,0.14)",
						boxShadow: "0 10px 60px rgba(124,58,237,0.18)",
					},
				}}
				BackdropProps={{ sx: { backgroundColor: "rgba(2,6,23,0.56)", backdropFilter: "blur(6px)" } }}
				// keep dialog centered while allowing content to scroll internally
				scroll="paper"
			>
				<DialogContent sx={{ py: 1.5, px: 2, maxHeight: "80vh", overflowY: "auto" }}>
					<div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
						{/* thumbnail */}
						<div style={{ minWidth: 136, display: "flex", alignItems: "center", justifyContent: "center" }}>
							{joinInfo?.thumbnail ? (
								<img src={joinInfo.thumbnail} alt={joinInfo.name} style={{ width: 136, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }} />
							) : (
								<div style={{ width: 136, height: 80, borderRadius: 10, background: "linear-gradient(90deg,#0f172a,#24123b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>
									No Image
								</div>
							)}
						</div>

						{/* details */}
						<div style={{ flex: 1 }}>
							<div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
								<div style={{ minWidth: 0 }}>
									<div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{joinInfo?.name ?? "Joining server"}</div>
									<div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", color: "rgba(255,255,255,0.87)", fontSize: 13 }}>
										<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><DirectionsCarIcon fontSize="small" /> <span style={{ fontWeight: 800 }}>{joinInfo?.carPack ?? "Default Pack"}</span></span>
										<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><PublicIcon fontSize="small" /> <span style={{ fontWeight: 800 }}>{joinInfo?.region ?? "Unknown"}</span></span>
									</div>
								</div>

								{joinInfo?.tier && (
									<span
										style={{
											display: "inline-block",
											padding: "6px 12px",
											borderRadius: 999,
											background: tierColor(joinInfo.tier),
											color: "#fff",
											fontWeight: 800,
											fontSize: 13,
										}}
									>
										{tierLabel(joinInfo.tier)}
									</span>
								)}
							</div>

							{/* divider & stats row */}
							<hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.04)", margin: "12px 0" }} />

							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
								<div style={{ display: "flex", gap: 18, alignItems: "center", color: "rgba(255,255,255,0.9)", fontWeight: 800 }}>
									<div style={{ display: "flex", alignItems: "center", gap: 8 }}><PeopleIcon fontSize="small" /> <span>{joinInfo?.id && serverCounts[joinInfo.id] ? `${serverCounts[joinInfo.id].players}/${serverCounts[joinInfo.id].maxPlayers}` : "N/A"}</span></div>
									<div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapIcon fontSize="small" /> <span style={{ opacity: 0.9 }}>{joinInfo?.region ?? "—"}</span></div>
								</div>

								{/* countdown large and readable */}
								<div style={{ textAlign: "right", minWidth: 96 }}>
									<div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Redirect in</div>
									<div style={{ fontSize: 22, fontWeight: 900, color: "#f0e6ff", textShadow: "0 0 14px rgba(124,58,237,0.6)" }}>
										{String(Math.floor(joinCountdown / 60)).padStart(2, "0")}:{String(joinCountdown % 60).padStart(2, "0")}
									</div>
								</div>
							</div>

							{/* progress bar */}
							<div style={{ marginTop: 12, height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" }}>
								<div
									style={{
										height: "100%",
										width: `${(joinInitialRef.current > 0 ? (joinCountdown / joinInitialRef.current) * 100 : 0).toFixed(2)}%`,
										background: "linear-gradient(90deg,#7c3aed,#d6b3ff)",
										transition: "width 0.4s linear",
									}}
								/>
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
							if (joinInfo?.url) window.open(joinInfo.url, "_blank", "noopener,noreferrer")
							closeJoinModal()
						}}
						sx={{ color: "#fff", background: "linear-gradient(90deg,#9b6bff,#7c3aed)", boxShadow: "0 12px 40px rgba(124,58,237,0.22)", px: 3 }}
					>
						Open Now
					</Button>
					<Button variant="outlined" onClick={closeJoinModal} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.12)" }}>
						Cancel
					</Button>
				</DialogActions>
			</Dialog>
			</div>
		</React.Fragment>
	)
}