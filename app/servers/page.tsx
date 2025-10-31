"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Pagination from "@mui/material/Pagination";

// config
import { DEFAULT_IP, SERVERS, type Server } from "./config";
import FilterModal from "./components/FilterModal";
import JoinModal from "./components/JoinModal";
import OfflineModal from "./components/OfflineModal";
import Toolbar from "./components/Toolbar";
import CountdownSummary from "./components/CountdownSummary";
import ServerRow from "./components/ServerRow";
import ContactUs from "@/Components/ContactUs";

type OrderKey = "name" | "tier" | "region" | "carPack" | "players" | "trafficDensity" | "map";
type LiveCount = { players: number; maxPlayers: number; online: boolean };

const VIDEO_SRC = "/videos/bg.mp4";
const PAGE_SIZE = 10;
const DEBUG_INFO = false;

// tier helpers (same looks)
const getTierMeta = (t?: string | null) => {
	const k = (t ?? "").toLowerCase().trim();
	if (["tier 0", "public", "beginner access", "beginner"].includes(k)) return { label: "Beginner Access", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
	if (["tier 1", "public+", "streetline", "street"].includes(k)) return { label: "Streetline", gradient: "linear-gradient(90deg,#3b82f6,#06b6d4)" };
	if (["tier 2", "midnight", "tandem club", "tandem"].includes(k)) return { label: "Tandem Club", gradient: "linear-gradient(90deg,#a855f7,#f59e0b)" };
	if (["tier 3", "underground", "pro line", "proline", "pro"].includes(k)) return { label: "Pro Line", gradient: "linear-gradient(90deg,#ff3d6e,#ff8c42)" };
	if (k === "bronze") return { label: "Bronze", gradient: "linear-gradient(90deg,#7c3a00,#b7791f)" };
	if (k === "silver") return { label: "Silver", gradient: "linear-gradient(90deg,#64748b,#94a3b8)" };
	if (k === "gold") return { label: "Gold", gradient: "linear-gradient(90deg,#b45309,#f59e0b)" };
	if (k === "platinum") return { label: "Platinum", gradient: "linear-gradient(90deg,#0ea5a4,#06b6d4)" };
	return { label: t ?? "Public", gradient: "linear-gradient(90deg,#374151,#6b7280)" };
};
const tierLabel = (t?: string | null) => getTierMeta(t).label;
const tierColor = (t?: string | null) => getTierMeta(t).gradient;

// fetch helpers
const fetchWithTimeout = async (url: string, timeout = 2000) => {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	try {
		const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
		clearTimeout(id);
		return res;
	} catch (err) {
		clearTimeout(id);
		throw err;
	}
};
const promiseWithTimeout = async <T,>(p: Promise<T>, ms = 8000): Promise<T> => {
	let id: ReturnType<typeof setTimeout> | null = null;
	const timeout = new Promise<never>((_, rej) => {
		id = setTimeout(() => rej(new Error("timeout")), ms);
	});
	try {
		return (await Promise.race([p, timeout])) as T;
	} finally {
		if (id) clearTimeout(id);
	}
};

// probe one server for live counts
export default function page() {
	// filters/sorting/pagination
	const [searchInput, setSearchInput] = useState("");
	const [searchName, setSearchName] = useState("");
	const [tier, setTier] = useState<string>("All");
	const [region, setRegion] = useState<string>("All");
	const [minPlayers, setMinPlayers] = useState<number>(0);
	const [maxPlayers, setMaxPlayers] = useState<number>(32);
	const [selectedCarPacks, setSelectedCarPacks] = useState<Set<string>>(new Set());
	const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set());
	const [selectedTraffic, setSelectedTraffic] = useState<Set<string>>(new Set());
	// include offline servers toggle (hidden by default)
	const [showOffline, setShowOffline] = useState<boolean>(false);
	const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<OrderKey>("name");
	const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
	const [pageIdx, setPageIdx] = useState<number>(1);

	// refresh/countdown
	const [secondsLeft, setSecondsLeft] = useState<number>(60);
	const [isFetching, setIsFetching] = useState<boolean>(false);
	const [refreshKey, setRefreshKey] = useState<number>(0);

	// live counts + change flash
	const [serverCounts, setServerCounts] = useState<Record<string, LiveCount>>({});
	const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
	const changeFlashTimeoutRef = useRef<number | null>(null);

	// progressive background scan cursor
	const backgroundIdxRef = useRef(0);

	// join modal
	const [joinModalOpen, setJoinModalOpen] = useState(false);
	const [joinInfo, setJoinInfo] = useState<{
		id?: string;
		url: string;
		name: string;
		thumbnail?: string;
		carPack?: string | null;
		region?: string | null;
		tier?: string | null;
	} | null>(null);
	const [joinCountdown, setJoinCountdown] = useState<number>(5);
	const joinTimerRef = useRef<number | null>(null);
	const joinInitialRef = useRef<number>(5);

	// offline modal
	const [offlineModalOpen, setOfflineModalOpen] = useState(false);
	const [offlineServerName, setOfflineServerName] = useState<string>("");

	// Endpoint hint cache so we try the last working endpoint first (must be inside component)
	const endpointHintRef = useRef<Record<string, { base: string; path: string; protocol: "http" | "https" }>>({});
	// Offline hysteresis to avoid flapping on transient failures (inside component)
	const offlineStrikesRef = useRef<Record<string, number>>({});

	// debounce search
	useEffect(() => {
		const t = setTimeout(() => setSearchName(searchInput), 400);
		return () => clearTimeout(t);
	}, [searchInput]);

	// helpers
	const toggleSetValue = (current: Set<string>, val: string, setter: (s: Set<string>) => void) => {
		const next = new Set(current);
		if (next.has(val)) next.delete(val);
		else next.add(val);
		setter(next);
	};
	const handleSort = (key: OrderKey) => {
		if (key === orderBy) setOrderDirection((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setOrderBy(key);
			setOrderDirection("asc");
		}
	};
	const openFilter = () => setFilterModalOpen(true);
	const closeFilter = () => setFilterModalOpen(false);
	const clearFiltersInModal = () => {
		setSelectedCarPacks(new Set());
		setSelectedMaps(new Set());
		setSelectedTraffic(new Set());
		setTier("All");
		setRegion("All");
		setMinPlayers(0);
		setMaxPlayers(32);
	};
	const applyFilters = () => closeFilter();
	const resetAll = () => {
		setSearchInput("");
		setSearchName("");
		setTier("All");
		setRegion("All");
		setSelectedCarPacks(new Set());
		setSelectedMaps(new Set());
		setSelectedTraffic(new Set());
		setMinPlayers(0);
		setMaxPlayers(32);
		setPageIdx(1);
	};

	// options
	const TIERS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.tier))).sort(), []);
	const REGIONS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.region))).sort(), []);
 	const CARPACKS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.carPack ?? "Default"))).sort(), []);
	const TRAFFICS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.trafficDensity))).sort(), []);
	const MAPS = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.map))).sort(), []);

	// stable keys for set deps to reduce recalcs
	const setKey = (s: Set<string>) => (s.size ? [...s].sort().join("|") : "");
	const selectedTrafficKey = useMemo(() => setKey(selectedTraffic), [selectedTraffic]);
	const selectedCarPacksKey = useMemo(() => setKey(selectedCarPacks), [selectedCarPacks]);
	const selectedMapsKey = useMemo(() => setKey(selectedMaps), [selectedMaps]);
	const searchNameLower = useMemo(() => (searchName || "").toLowerCase(), [searchName]);

	// detect tab visibility to pause timers/network when hidden
	const [isVisible, setIsVisible] = useState(true);
	useEffect(() => {
		const onVis = () => setIsVisible(!document.hidden);
		document.addEventListener("visibilitychange", onVis);
		return () => document.removeEventListener("visibilitychange", onVis);
	}, []);

	// unified filter predicate (used in multiple places)
	const filterPredicate = useCallback(
		(s: Server) => {
			if (searchNameLower && !s.name.toLowerCase().includes(searchNameLower)) return false;
			if (tier !== "All" && s.tier !== tier) return false;
			if (region !== "All" && s.region !== region) return false;

			// use live counts (fallback to config) for players range checks
			const live = serverCounts[s.id];
			const livePlayers = live?.players ?? s.players;
			const liveMax = live?.maxPlayers ?? s.maxPlayers;
			if (livePlayers < minPlayers) return false;
			if (livePlayers > maxPlayers) return false;

			if (selectedTraffic.size > 0 && !selectedTraffic.has(s.trafficDensity)) return false;
			const carPackKey = s.carPack ?? "Default";
			if (selectedCarPacks.size > 0 && !selectedCarPacks.has(carPackKey)) return false;
			if (selectedMaps.size > 0 && !selectedMaps.has(s.map)) return false;

			// hide offline servers unless explicitly included
			if (!showOffline) {
				const stat = live;
				if (stat && stat.online !== true) return false;
			}
			return true;
		},
		[
			searchNameLower,
			tier,
			region,
			minPlayers,
			maxPlayers,
			selectedTrafficKey,
			selectedCarPacksKey,
			selectedMapsKey,
			showOffline,
			serverCounts
		]
	);

	// filter/sort/page
	const filtered = useMemo(() => SERVERS.filter(filterPredicate), [filterPredicate]);

	const displayed = useMemo(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			let cmp = 0;
			if (orderBy === "players") {
				const pa = serverCounts[a.id]?.players ?? 0;
				const pb = serverCounts[b.id]?.players ?? 0;
				cmp = pa - pb;
			} else {
				const va = String(orderBy === "carPack" ? (a.carPack ?? "Default") : (a as any)[orderBy] ?? "").toLowerCase();
				const vb = String(orderBy === "carPack" ? (b.carPack ?? "Default") : (b as any)[orderBy] ?? "").toLowerCase();
				cmp = va < vb ? -1 : va > vb ? 1 : 0;
			}
			if (cmp === 0) cmp = a.name.localeCompare(b.name);
			return orderDirection === "asc" ? cmp : -cmp;
		});
		return arr;
	}, [filtered, orderBy, orderDirection, serverCounts]);

	const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
	const paginated = displayed.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);
	const paginatedIds = useMemo(() => paginated.map((s) => s.id).join(","), [paginated]);

	// keep in range, reset when filters change
	useEffect(() => {
		if (pageIdx > pageCount) setPageIdx(pageCount);
	}, [pageIdx, pageCount]);
	useEffect(() => {
		setPageIdx(1);
	}, [searchName, tier, region, minPlayers, maxPlayers, selectedCarPacks, selectedMaps, selectedTraffic, showOffline]);

	// when hiding offline servers, prefetch live status for all filtered candidates
	const filteredIds = useMemo(() => SERVERS.filter(filterPredicate).map((s) => s.id), [filterPredicate]);

	useEffect(() => {
		if (showOffline) return;
		// find filtered servers that don't have a status yet
		const missing = SERVERS.filter((s) => filteredIds.includes(s.id) && serverCounts[s.id] === undefined);
		if (missing.length === 0) return;
		void (async () => {
			try {
				await fetchCountsForServers(missing, { concurrency: 2, perRequestTimeout: 2500 });
			} catch {
				// ignore
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filteredIds.join("|"), showOffline]);

	// counts fetch: limited concurrency workers, mark offline when miss
	const fetchCountsForServers = useCallback(async (servers: Server[], opts?: { concurrency?: number; perRequestTimeout?: number; strictOffline?: boolean }) => {
		// adaptive concurrency: scale within [2..6] if available
		const hc = (typeof navigator !== "undefined" && (navigator as any).hardwareConcurrency) ? (navigator as any).hardwareConcurrency : 4;
		const adaptive = Math.min(6, Math.max(2, Math.floor(hc / 2)));
		const concurrency = Math.max(1, opts?.concurrency ?? adaptive);
		const perRequestTimeout = opts?.perRequestTimeout ?? 2500;
		const results: Record<string, { players: number; maxPlayers: number; chosen?: { base: string; path: string; protocol: "http" | "https" } }> = {};
		let idx = 0;

		const workers = Array.from({ length: concurrency }).map(async () => {
			while (true) {
				const i = idx++;
				if (i >= servers.length) break;
				const s = servers[i];
				try {
					const hint = endpointHintRef.current[s.id];
					const data = await fetchServerCount(s, perRequestTimeout, hint);
					if (data) {
						results[s.id] = data;
						if (data.chosen) endpointHintRef.current[s.id] = data.chosen;
					}
				} catch {
					// ignore
				}
			}
		});
		await Promise.all(workers);

		// Build final map with online/offline (gentler for brand-new entries)
		const final: Record<string, LiveCount> = {};
		const missesToOffline = opts?.strictOffline ? 1 : 2;
		for (const s of servers) {
			const hit = results[s.id];
			if (hit) {
				offlineStrikesRef.current[s.id] = 0;
				const max = Math.max(0, hit.maxPlayers);
				const players = Math.max(0, Math.min(hit.players, max));
				final[s.id] = { players, maxPlayers: max, online: true };
			} else {
				const prevStrikes = offlineStrikesRef.current[s.id] ?? 0;
				const strikes = prevStrikes + 1;
				offlineStrikesRef.current[s.id] = strikes;
				const prev = serverCounts[s.id];

				// If we have a previous value and haven't hit threshold, keep it (avoid flicker)
				if (prev && strikes < missesToOffline) {
					final[s.id] = prev;
				} else if (!prev && strikes < missesToOffline) {
					// First miss on a brand-new server: keep unknown (don't force offline yet)
					// skip adding to final to avoid overwriting an eventual newer value
					continue;
				} else {
					// Threshold reached: mark offline with safe defaults
					final[s.id] = { players: 0, maxPlayers: s.maxPlayers ?? 0, online: false };
				}
			}
		}

		setServerCounts((prev) => {
			const next: Record<string, LiveCount> = { ...prev, ...final };
			const changed = new Set<string>();
			for (const id of Object.keys(final)) {
				const before = prev[id]?.players;
				const after = next[id]?.players;
				if (typeof before === "number" && typeof after === "number" && before !== after) {
					changed.add(id);
				}
			}
			if (changed.size) {
				setChangedIds(changed);
				if (changeFlashTimeoutRef.current) clearTimeout(changeFlashTimeoutRef.current);
				changeFlashTimeoutRef.current = window.setTimeout(() => setChangedIds(new Set()), 2200);
			}
			return next;
		});
	}, []);

	// do refresh for current page
	const isAutoRefreshPaused = !isVisible || filterModalOpen || joinModalOpen || offlineModalOpen;
	const doRefresh = useCallback(async () => {
		if (isFetching || isAutoRefreshPaused || paginated.length === 0) return;
		setIsFetching(true);
		try {
			// small bump to help first-page succeed faster
			await promiseWithTimeout(fetchCountsForServers(paginated, { concurrency: 3, perRequestTimeout: 3000 }), 15000);
		} catch {
			// ignore
		} finally {
			setIsFetching(false);
			setSecondsLeft(60);
			setRefreshKey((k) => k + 1);
		}
	}, [isFetching, isAutoRefreshPaused, paginated, fetchCountsForServers]);

	// initial/page-change fetch (prioritize current page)
	useEffect(() => {
		if (paginated.length === 0) return;
		let cancelled = false;
		(async () => {
			setIsFetching(true);
			try {
				await promiseWithTimeout(fetchCountsForServers(paginated, { concurrency: 3, perRequestTimeout: 3000 }), 15000);
			} catch {
				// ignore
			} finally {
				if (!cancelled) {
					setIsFetching(false);
					setSecondsLeft(60);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [paginatedIds, fetchCountsForServers, paginated.length]);

	// prefetch the next page to reduce "—" on pagination
	const nextPageServers = useMemo(() => {
		// compute next slice if it exists
		return (pageIdx < Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))
			? filtered.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
			: [];
	}, [filtered, pageIdx]);
	useEffect(() => {
		if (nextPageServers.length === 0 || isAutoRefreshPaused) return;
		void (async () => {
			try {
				await fetchCountsForServers(nextPageServers, { concurrency: 2, perRequestTimeout: 2800 });
			} catch {
				// ignore
			}
		})();
	}, [fetchCountsForServers, isAutoRefreshPaused, nextPageServers.map(s => s.id).join("|")]);

	// progressive background prefetch for the rest (small batches, low pressure)
	useEffect(() => {
		let stopped = false;
		const tick = async () => {
			if (stopped || isAutoRefreshPaused) return;
			// Skip current page; background-scan others in a rotating window
			const pageSet = new Set(paginated.map((s) => s.id));
			const pool = SERVERS.filter((s) => !pageSet.has(s.id));
			if (pool.length === 0) return;

			const start = backgroundIdxRef.current % pool.length;
			const batchSize = 12;
			const batch: Server[] = [];
			for (let i = 0; i < pool.length && batch.length < batchSize; i++) {
				batch.push(pool[(start + i) % pool.length]);
			}
			backgroundIdxRef.current = start + batch.length;

			try {
				await fetchCountsForServers(batch, { concurrency: 3, perRequestTimeout: 2800 });
			} catch {
				// ignore
			}
		};

		// run once quickly, then at intervals
		void tick();
		const id = setInterval(() => void tick(), 3000);
		return () => {
			stopped = true;
			clearInterval(id);
		};
	}, [fetchCountsForServers, isAutoRefreshPaused, paginatedIds]);

	// countdown -> auto refresh (paused when hidden or modal open)
	useEffect(() => {
		const id = setInterval(() => {
			setSecondsLeft((s) => {
				if (isFetching || isAutoRefreshPaused) return s;
				if (s <= 1) {
					doRefresh();
					return 60;
				}
				return s - 1;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [doRefresh, isFetching, isAutoRefreshPaused]);

	// manual refresh
	const refreshNow = async () => {
		await doRefresh();
	};

	// join modal open/close
	const openJoinModal = (server: Server, url: string, seconds = 5) => {
		joinInitialRef.current = seconds;
		setJoinInfo({
			id: server.id,
			name: server.name,
			url,
			thumbnail: server.thumbnail,
			carPack: server.carPack ?? "Default Pack",
			region: server.region,
			tier: server.tier,
		});
		setJoinCountdown(seconds);
		setJoinModalOpen(true);
	};
	const closeJoinModal = () => {
		setJoinModalOpen(false);
		setJoinInfo(null);
		setJoinCountdown(5);
		if (joinTimerRef.current) {
			clearInterval(joinTimerRef.current);
			joinTimerRef.current = null;
		}
	};
	useEffect(() => {
		if (!joinModalOpen || !joinInfo) return;
		if (joinTimerRef.current) {
			clearInterval(joinTimerRef.current);
			joinTimerRef.current = null;
		}
		joinTimerRef.current = window.setInterval(() => {
			setJoinCountdown((c) => {
				if (c <= 1) {
					if (joinTimerRef.current) {
						clearInterval(joinTimerRef.current);
						joinTimerRef.current = null;
					}
					if (joinInfo?.url) window.open(joinInfo.url, "_blank", "noopener,noreferrer");
					closeJoinModal();
					return 0;
				}
				return c - 1;
			});
		}, 1000);
		return () => {
			if (joinTimerRef.current) {
				clearInterval(joinTimerRef.current);
				joinTimerRef.current = null;
			}
		};
	}, [joinModalOpen, joinInfo]);

	// offline modal helpers
	const openOfflineModal = (name: string) => {
		setOfflineServerName(name);
		setOfflineModalOpen(true);
	};
	const closeOfflineModal = () => {
		setOfflineModalOpen(false);
		setOfflineServerName("");
	};

	// totals
	const totalPlayers = useMemo(() => SERVERS.reduce((sum, s) => sum + (serverCounts[s.id]?.players ?? 0), 0), [serverCounts]);
	const totalMaxPlayers = useMemo(() => SERVERS.reduce((sum, s) => sum + (serverCounts[s.id]?.maxPlayers ?? s.maxPlayers ?? 0), 0), [serverCounts]);

	// UI
	return (
		<React.Fragment>
			<div>
				<video aria-hidden="true" src={VIDEO_SRC} autoPlay muted loop playsInline preload="auto" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", objectFit: "cover", zIndex: 0, border: 0, pointerEvents: "none" }} />
			</div>

			<div style={{ padding: 30, paddingTop: 50, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18, position: "relative", zIndex: 1 }}>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ width: "100%", maxWidth: 1600, display: "flex", flexDirection: "column", gap: 16 }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "0 0 12px rgba(124,58,237,0.18)" }}>Servers</h2>
							<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700, opacity: 0.95, fontSize: 16 }}>Browse and filter available servers</p>
						</div>

						{/* Toolbar extracted */}
						<Toolbar
							isFetching={isFetching}
							searchInput={searchInput}
							setSearchInput={setSearchInput}
							openFilter={openFilter}
							refreshNow={refreshNow}
							resetAll={resetAll}
						/>
					</div>
				</div>

				{/* Countdown + totals extracted */}
				<CountdownSummary
					secondsLeft={secondsLeft}
					isFetching={isFetching}
					totalPlayers={totalPlayers}
					totalMaxPlayers={totalMaxPlayers}
					filteredCount={filtered.length}
				/>

				{isFetching && (
					<div style={{ maxWidth: 1600, margin: "6px auto 0", padding: "8px", background: "#2a0b51", color: "#fff", borderRadius: 8, fontWeight: 900, textAlign: "center" }}>
						Refreshing server list — please wait
					</div>
				)}

				{/* table */}
				<div style={{ width: "100%", maxWidth: 1600, margin: "0 auto", position: "relative" }}>
					{/* header */}
					<div style={{ background: "rgba(10,8,15,0.36)", border: "1px solid rgba(124,58,237,0.06)", padding: 12, color: "#fff", position: "sticky", top: 12, zIndex: 6, backdropFilter: "blur(6px)" }}>
						<div style={{ display: "grid", gridTemplateColumns: "360px 180px 140px 180px 140px 140px 220px 140px", gap: 8, padding: "8px 12px", fontWeight: 800 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => handleSort("name")}>Server Name {orderBy === "name" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ cursor: "pointer" }} onClick={() => handleSort("tier")}>Tier {orderBy === "tier" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("region")}>Region {orderBy === "region" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("carPack")}>Car Pack {orderBy === "carPack" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("players")}>Players {orderBy === "players" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("trafficDensity")}>Traffic {orderBy === "trafficDensity" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("map")}>Map {orderBy === "map" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ textAlign: "right" }}>Action</div>
						</div>
					</div>

					<div>
						{isFetching ? (
							<div role="row" style={{ display: "grid", gridTemplateColumns: "360px 180px 140px 180px 140px 140px 220px 140px", padding: 28, minHeight: 120, borderBottom: "1px solid rgba(255,255,255,0.03)", textAlign: "center", color: "rgba(255,255,255,0.9)", fontWeight: 900 }}>
								<div style={{ gridColumn: "1 / -1" }}>Fetching servers — table temporarily empty</div>
							</div>
						) : paginated.length === 0 ? (
							<div style={{ padding: 28, textAlign: "center", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>No servers found — try adjusting filters</div>
						) : (
							<>
								<style>{`
									.server-card { display: grid; grid-template-columns: 360px 180px 140px 180px 140px 140px 220px 140px; align-items: center; gap: 8px; padding: 14px; margin-bottom: 12px; background: rgba(10,8,15,0.45); border-radius: 12px; border: 1px solid rgba(139,40,255,0.22); box-shadow: 0 8px 30px rgba(139,40,255,0.06), 0 0 18px rgba(139,40,255,0.06) inset; transition: transform 0.14s ease, box-shadow 0.14s ease; }
									.server-card:hover { transform: translateY(-4px); box-shadow: 0 18px 50px rgba(139,40,255,0.12), 0 0 28px rgba(139,40,255,0.12) inset; }
									.server-card.changed { animation: row-flash 2.2s ease; box-shadow: 0 20px 48px rgba(124,58,237,0.12), 0 0 24px rgba(124,58,237,0.06) inset; }
									@keyframes row-flash { 0% { background: linear-gradient(90deg, rgba(34,197,94,0.12), rgba(124,58,237,0.06)); transform: translateY(-2px); } 40% { background: rgba(10,8,15,0.62); transform: translateY(0); } 100% { background: rgba(10,8,15,0.45); transform: translateY(0); } }
								`}</style>

								{paginated.map((s) => (
									<ServerRow
										key={s.id}
										server={s}
										// Show only live JSON values; if undefined, the row will display "—" until fetched
										stat={serverCounts[s.id]}
										changed={changedIds.has(s.id)}
										isFetching={isFetching}
										onJoin={(server, url) => openJoinModal(server, url, 5)}
										onOffline={(name) => openOfflineModal(name)}
										tierLabel={tierLabel}
										tierColor={tierColor}
									/>
								))}
							</>
						)}
					</div>

					{!isFetching && (
						<div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
							<Pagination count={pageCount} page={pageIdx} onChange={(_, v) => setPageIdx(v)} color="primary" siblingCount={1} boundaryCount={1} showFirstButton showLastButton sx={{ "& .MuiPaginationItem-root": { color: "#fff" }, "& .Mui-selected": { background: "#7c3aed" } }} />
						</div>
					)}
				</div>

				<FilterModal
					open={filterModalOpen}
					onClose={closeFilter}
					region={region}
					setRegion={setRegion}
					tier={tier}
					setTier={setTier}
					selectedTraffic={selectedTraffic}
					setSelectedTraffic={setSelectedTraffic}
					selectedCarPacks={selectedCarPacks}
					setSelectedCarPacks={setSelectedCarPacks}
					selectedMaps={selectedMaps}
					setSelectedMaps={setSelectedMaps}
					showOffline={showOffline}
					setShowOffline={setShowOffline}
					REGIONS={REGIONS}
					TIERS={TIERS}
					TRAFFICS={TRAFFICS}
					CARPACKS={CARPACKS}
					MAPS={MAPS}
					toggleSetValue={toggleSetValue}
					clearFiltersInModal={clearFiltersInModal}
					applyFilters={applyFilters}
					tierLabel={tierLabel}
				/>

				<JoinModal
					open={joinModalOpen}
					onClose={closeJoinModal}
					joinInfo={joinInfo}
					joinCountdown={joinCountdown}
					joinInitialPercent={joinInitialRef.current > 0 ? (joinCountdown / joinInitialRef.current) * 100 : 0}
					serverCounts={serverCounts}
					tierLabel={tierLabel}
					tierColor={tierColor}
				/>

				<OfflineModal open={offlineModalOpen} onClose={closeOfflineModal} name={offlineServerName} />

				<ContactUs />
			</div>
		</React.Fragment>
	);
}

// Smarter JSON shape parser across various server implementations
const deriveCounts = (body: any, s: Server): { players: number; maxPlayers: number } | undefined => {
	try {
		// Normalize wrapper
		const b = (typeof body === "number") ? { clients: body } : (body?.result ?? body?.data ?? body);

		// AssettoServer /info shape (example):
		// { cars: [...], clients: 0, maxclients: 10, ... }
		if (typeof b?.clients === "number" && typeof b?.maxclients === "number") {
			return { players: b.clients, maxPlayers: b.maxclients };
		}

		// Other common keys as fallback
		const nums = (keys: string[]) => keys.find((k) => typeof b?.[k] === "number") as string | undefined;
		const playersKey = nums(["clients","Clients","players","Players","currentPlayers","playersCount","playerCount","connected","DriverCount","drivercount","carCount"]);
		const maxKey = nums(["maxclients","maxClients","maxPlayers","MaxPlayers","max","max_players","capacity","slots","max_slots","MaxClients"]);
		const players = playersKey ? b[playersKey] : undefined;
		const maxPlayers = maxKey ? b[maxKey] : (typeof s.maxPlayers === "number" ? s.maxPlayers : undefined);
		if (typeof players === "number" && typeof maxPlayers === "number") {
			return { players, maxPlayers };
		}
	} catch {
		// ignore
	}
	return undefined;
};

async function fetchServerCount(
	s: Server,
	perRequestTimeout = 2500,
	hint?: { base: string; path: string; protocol: "http" | "https" }
): Promise<{ players: number; maxPlayers: number; chosen?: { base: string; path: string; protocol: "http" | "https" } } | undefined> {
	const host = s.host || DEFAULT_IP;
	const bases = [`http://${host}:${s.httpPort}`, `https://${host}:${s.httpPort}`];
	// Try multiple common endpoints — keep /info first, then common fallbacks
	const paths = [
		"/info", "/INFO",
		"/json", "/JSON", "/statusJSON",
		"/status", "/players.json",
		"/entrylist", "/api/entrylist", "/api/session", "/session",
		"/players", "/clients",
	];

	// Build candidate list; if we have a working hint, try it first
	const candidates: Array<{ base: string; path: string; protocol: "http" | "https" }> = [];
	if (hint) candidates.push(hint);
	for (const base of bases) {
		for (const path of paths) {
			const protocol = base.startsWith("https://") ? "https" : "http";
			if (hint && hint.base === base && hint.path === path) continue; // already added
			candidates.push({ base, path, protocol });
		}
	}

	for (const cand of candidates) {
		const { base, path, protocol } = cand;
		const url = `${base}${path}`;
		const isInfo = path.toLowerCase() === "/info";
		const isHttps = protocol === "https";
		const proxied = (tmo: number) => `/api/proxy?u=${encodeURIComponent(url)}&t=${tmo}&q=1`;
		const attempts = isInfo ? 2 : 1;
		for (let attempt = 0; attempt < attempts; attempt++) {
			let tmo = isInfo
				? (attempt === 0 ? Math.max(2000, perRequestTimeout) : Math.max(5000, perRequestTimeout * 2))
				: perRequestTimeout;
			// HTTPS can be slower — don't clamp too aggressively
			if (isHttps) tmo = attempt === 0 ? Math.max(tmo, 3500) : Math.max(tmo, 6000);
			if (isInfo && DEBUG_INFO) console.log(`[servers] /info try a=${attempt + 1}/${attempts} tmo=${tmo} url=${url}`);

			try {
				const res = await fetchWithTimeout(proxied(tmo), tmo + 1500);
				if (!res.ok) {
					if (isInfo && DEBUG_INFO) console.warn(`[servers] /info not ok status=${res.status} url=${url}`);
					continue;
				}
				const ct = (res.headers.get("content-type") || "").toLowerCase();
				let body: any = null;
				if (ct.includes("application/json")) {
					body = await res.json().catch(() => null);
				} else {
					const text = await res.text();
					try {
						body = JSON.parse(text);
					} catch {
						body = null;
					}
				}
				if (body == null || (typeof body !== "object" && typeof body !== "number")) {
					if (isInfo && DEBUG_INFO) console.warn(`[servers] /info invalid JSON url=${url}`);
					continue;
				}

				const derived = deriveCounts(body, s);
				if (derived) {
					if (isInfo && DEBUG_INFO) console.log("[servers] /info derived", { url, ...derived });
					return { ...derived, chosen: { base, path, protocol } };
				}
			} catch (err: any) {
				if (isInfo && DEBUG_INFO) {
					const msg = err?.name === "AbortError" ? "aborted(timeout)" : `err=${err?.name ?? ""} ${err?.message ?? String(err)}`;
					console.warn(`[servers] /info ${msg} url=${url}`);
				}
			}
		}
	}
	return undefined;
}