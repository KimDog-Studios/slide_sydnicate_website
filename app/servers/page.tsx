"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Pagination from "@mui/material/Pagination";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

// config
import { DEFAULT_IP, SERVERS, type Server } from "./config";
import FilterModal from "./components/FilterModal";
import JoinModal from "./components/JoinModal";
import Toolbar from "./components/Toolbar";
import CountdownSummary from "./components/CountdownSummary";
import ServerRow from "./components/ServerRow";
import ContactUs from "@/Components/ContactUs";

type OrderKey = "name" | "tier" | "region" | "carPack" | "players" | "trafficDensity" | "map";
type LiveCount = { players: number; maxPlayers: number; online: boolean };

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
		// add Accept header to improve JSON negotiation
		const res = await fetch(url, {
			signal: controller.signal,
			cache: "no-store",
			headers: { Accept: "application/json,text/plain;q=0.8,*/*;q=0.5" },
		});
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
	// drop unused state variable, keep setter only
	const [, setRefreshKey] = useState<number>(0);

	// live counts + change flash
	const [serverCounts, setServerCounts] = useState<Record<string, LiveCount>>({});
	const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
	const changeFlashTimeoutRef = useRef<number | null>(null);

	// progressive background scan cursor
	const backgroundIdxRef = useRef(0);

	// per-server cooldown to avoid hammering the proxy/servers
	const lastFetchedRef = useRef<Record<string, number>>({});

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

	// page size (persisted)
	const [pageSize, setPageSize] = useState<number>(() => {
		const raw = typeof window !== "undefined" ? window.localStorage.getItem("servers.pageSize") : null;
		const n = raw ? parseInt(raw, 10) : 10;
		return [10, 25, 50].includes(n) ? n : 10;
	});

	// load saved filters on mount
	useEffect(() => {
		try {
			const raw = window.localStorage.getItem("servers.filters");
			if (!raw) return;
			const f = JSON.parse(raw);
			if (typeof f?.tier === "string") setTier(f.tier);
			if (typeof f?.region === "string") setRegion(f.region);
			if (Array.isArray(f?.selectedCarPacks)) setSelectedCarPacks(new Set<string>(f.selectedCarPacks));
			if (Array.isArray(f?.selectedMaps)) setSelectedMaps(new Set<string>(f.selectedMaps));
			if (Array.isArray(f?.selectedTraffic)) setSelectedTraffic(new Set<string>(f.selectedTraffic));
			if (typeof f?.showOffline === "boolean") setShowOffline(f.showOffline);
			if (typeof f?.minPlayers === "number") setMinPlayers(f.minPlayers);
			if (typeof f?.maxPlayers === "number") setMaxPlayers(f.maxPlayers);
		} catch {
			// ignore
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// persist filters on change
	useEffect(() => {
		try {
			const data = {
				tier,
				region,
				selectedCarPacks: [...selectedCarPacks],
				selectedMaps: [...selectedMaps],
				selectedTraffic: [...selectedTraffic],
				showOffline,
				minPlayers,
				maxPlayers,
			};
			window.localStorage.setItem("servers.filters", JSON.stringify(data));
		} catch {
			// ignore
		}
	}, [tier, region, selectedCarPacks, selectedMaps, selectedTraffic, showOffline, minPlayers, maxPlayers]);

	// persist page size
	useEffect(() => {
		try {
			window.localStorage.setItem("servers.pageSize", String(pageSize));
		} catch {
			// ignore
		}
	}, [pageSize]);

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
	// Force traffic filter options to the required set
	const TRAFFICS = useMemo(() => ["None", "Light", "Heavy", "Realistic"], []);
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

	// derive traffic density to make filters work even if config normalized to "None"
	const deriveTraffic = useCallback((s: Server): "None" | "Light" | "Heavy" | "Realistic" => {
		// Heuristics:
		// - KimDog Hesi servers: SRP as Realistic, others Light/Heavy by port parity for variety
		if ((s.carPack || "").toLowerCase() === "kimdog hesi") {
			if (s.name?.toLowerCase().includes("srp")) return "Realistic";
			return (s.httpPort % 2 === 1) ? "Heavy" : "Light";
		}
		// fallback to configured value or None
		return (s.trafficDensity as any) ?? "None";
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
			if (livePlayers < minPlayers) return false;
			if (livePlayers > maxPlayers) return false;

			// use derived traffic for filtering
			const tfx = deriveTraffic(s);
			if (selectedTraffic.size > 0 && !selectedTraffic.has(tfx)) return false;
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
			serverCounts,
			deriveTraffic
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
			} else if (orderBy === "trafficDensity") {
				const ta = deriveTraffic(a).toLowerCase();
				const tb = deriveTraffic(b).toLowerCase();
				cmp = ta < tb ? -1 : ta > tb ? 1 : 0;
			} else {
				const va = String(orderBy === "carPack" ? (a.carPack ?? "Default") : (a as any)[orderBy] ?? "").toLowerCase();
				const vb = String(orderBy === "carPack" ? (b.carPack ?? "Default") : (b as any)[orderBy] ?? "").toLowerCase();
				cmp = va < vb ? -1 : va > vb ? 1 : 0;
			}
			if (cmp === 0) cmp = a.name.localeCompare(b.name);
			return orderDirection === "asc" ? cmp : -cmp;
		});
		return arr;
	}, [filtered, orderBy, orderDirection, serverCounts, deriveTraffic]);

	const pageCount = useMemo(() => Math.max(1, Math.ceil(displayed.length / pageSize)), [displayed.length, pageSize]);
	const paginated = useMemo(() => displayed.slice((pageIdx - 1) * pageSize, pageIdx * pageSize), [displayed, pageIdx, pageSize]);
	const paginatedIds = useMemo(() => paginated.map((s) => s.id).join(","), [paginated]);

	// keep in range, reset when filters change
	useEffect(() => {
		if (pageIdx > pageCount) setPageIdx(pageCount);
	}, [pageIdx, pageCount]);
	useEffect(() => {
		setPageIdx(1);
	}, [searchName, tier, region, minPlayers, maxPlayers, selectedCarPacks, selectedMaps, selectedTraffic, showOffline, pageSize]);

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
	const fetchCountsForServers = useCallback(async (servers: Server[], opts?: {
		concurrency?: number;
		perRequestTimeout?: number;
		strictOffline?: boolean;
		cooldownMs?: number;   // skip servers fetched recently unless force
		force?: boolean;       // bypass cooldown (e.g., manual refresh/current page)
	}) => {
		// adaptive concurrency: scale within [2..6] if available
		const hc = (typeof navigator !== "undefined" && (navigator as any).hardwareConcurrency) ? (navigator as any).hardwareConcurrency : 4;
		const adaptive = Math.min(6, Math.max(2, Math.floor(hc / 2)));
		const concurrency = Math.max(1, opts?.concurrency ?? adaptive);
		const perRequestTimeout = opts?.perRequestTimeout ?? 2500;
		const cooldownMs = Math.max(1000, opts?.cooldownMs ?? 9000);
		const now = Date.now();

		// respect cooldown unless forced
		const work = opts?.force ? servers : servers.filter(s => {
			const last = lastFetchedRef.current[s.id] ?? 0;
			return (now - last) > cooldownMs;
		});
		if (work.length === 0) return;

		const results: Record<string, { players: number; maxPlayers: number; chosen?: { base: string; path: string; protocol: "http" | "https" } }> = {};
		let idx = 0;

		const workers = Array.from({ length: concurrency }).map(async () => {
			while (true) {
				const i = idx++;
				if (i >= work.length) break;
				const s = work[i];
				try {
					const hint = endpointHintRef.current[s.id];
					const data = await fetchServerCount(s, perRequestTimeout, hint);
					// mark last fetched regardless of hit/miss to throttle
					lastFetchedRef.current[s.id] = Date.now();
					if (data) {
						results[s.id] = data;
						if (data.chosen) endpointHintRef.current[s.id] = data.chosen;
					}
				} catch {
					// still update cooldown
					lastFetchedRef.current[s.id] = Date.now();
				}
			}
		});
		await Promise.all(workers);

		// Build final map with online/offline (gentler for brand-new entries)
		const final: Record<string, LiveCount> = {};
		const missesToOffline = opts?.strictOffline ? 1 : 2;
		for (const s of work) {
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
				if (prev && strikes < missesToOffline) {
					final[s.id] = prev;
				} else if (!prev && strikes < missesToOffline) {
					continue; // keep unknown on first miss
				} else {
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
			// force bypass cooldown for visible page
			await promiseWithTimeout(
				fetchCountsForServers(paginated, { concurrency: 3, perRequestTimeout: 3000, force: true }),
				15000
			);
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
				await promiseWithTimeout(
					fetchCountsForServers(paginated, { concurrency: 3, perRequestTimeout: 3000, force: true }),
					15000
				);
			} catch {
				// ignore
			} finally {
				if (!cancelled) {
					setIsFetching(false);
					setSecondsLeft(60);
				}
			}
		})();
		return () => { cancelled = true; };
	}, [paginatedIds, fetchCountsForServers, paginated.length]);

	// prefetch next page (respect cooldown) - use dynamic pageSize
	const nextPageServers = useMemo(() => {
		const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
		return (pageIdx < totalPages)
			? filtered.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize)
			: [];
	}, [filtered, pageIdx, pageSize]);
	useEffect(() => {
		if (nextPageServers.length === 0 || isAutoRefreshPaused) return;
		void (async () => {
			try {
				await fetchCountsForServers(nextPageServers, { concurrency: 2, perRequestTimeout: 2800, cooldownMs: 9000 });
			} catch {}
		})();
	}, [fetchCountsForServers, isAutoRefreshPaused, nextPageServers.map(s => s.id).join("|")]);

	// progressive background prefetch (respect cooldown)
	useEffect(() => {
		let stopped = false;
		const tick = async () => {
			if (stopped || isAutoRefreshPaused) return;
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
				await fetchCountsForServers(batch, { concurrency: 3, perRequestTimeout: 2800, cooldownMs: 9000 });
			} catch {}
		};
		void tick();
		const id = setInterval(() => void tick(), 3000);
		return () => { stopped = true; clearInterval(id); };
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
	const openJoinModal = (server: Server, _url: string, seconds = 5) => {
		const cmUrl = makeCmUrl(server);
		joinInitialRef.current = seconds;
		setJoinInfo({
			id: server.id,
			name: server.name,
			url: cmUrl, // always use CM link
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
					// Navigate directly to CM without opening a new tab
					if (joinInfo?.url) window.location.href = joinInfo.url;
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

	// Join anyway handler (best-effort Content Manager link)
	const joinAnyway = useCallback(() => {
		const s = SERVERS.find((x) => x.name === offlineServerName);
		if (!s) {
			closeOfflineModal();
			return;
		}
		// Navigate directly to CM without opening a new tab
		window.location.href = makeCmUrl(s);
		closeOfflineModal();
	}, [offlineServerName, makeCmUrl]);

	// totals
	const totalPlayers = useMemo(() => SERVERS.reduce((sum, s) => sum + (serverCounts[s.id]?.players ?? 0), 0), [serverCounts]);
	const totalMaxPlayers = useMemo(() => SERVERS.reduce((sum, s) => sum + (serverCounts[s.id]?.maxPlayers ?? s.maxPlayers ?? 0), 0), [serverCounts]);

	// typewriter placeholder: use server names from config (unique)
	const PLACEHOLDER_NAMES = useMemo(() => {
		const names = SERVERS.map((s) => s.name).filter(Boolean) as string[];
		return Array.from(new Set(names));
	}, []);
	const [phIndex, setPhIndex] = useState(0);
	const [phPos, setPhPos] = useState(0);
	const [phDeleting, setPhDeleting] = useState(false);
	const [typedPlaceholder, setTypedPlaceholder] = useState("");

	// Run animation only when visible, idle, and we have names
	const animActive = useMemo(
		() => !searchInput && isVisible && !filterModalOpen && !joinModalOpen && !offlineModalOpen && PLACEHOLDER_NAMES.length > 0,
		[searchInput, isVisible, filterModalOpen, joinModalOpen, offlineModalOpen, PLACEHOLDER_NAMES.length]
	);

	// Blinking heavy cursor (┃) only while animating
	const [cursorOn, setCursorOn] = useState(true);
	useEffect(() => {
		if (!animActive) return;
		const id = window.setInterval(() => setCursorOn((c) => !c), 550);
		return () => clearInterval(id);
	}, [animActive]);

	// Compose placeholder; never show default while animating (even during deletion)
	const displayedPlaceholder = useMemo(() => {
		const bar = "┃";
		if (animActive) {
			const base = typedPlaceholder; // may be empty mid-cycle; that's OK, caret shows progress
			return `${base}${cursorOn ? ` ${bar}` : "  "}`;
		}
		return "Search servers...";
	}, [animActive, typedPlaceholder, cursorOn]);

	// Advance typewriter only when animating
	useEffect(() => {
		if (!animActive) return;

		const pool = PLACEHOLDER_NAMES;
		const full = pool[phIndex % pool.length];
		setTypedPlaceholder(full.slice(0, phPos));

		let id: number;
		if (!phDeleting && phPos < full.length) {
			// typing forward
			id = window.setTimeout(() => setPhPos((p) => p + 1), 60 + Math.random() * 70);
		} else if (!phDeleting && phPos >= full.length) {
			// pause at end then start deleting
			id = window.setTimeout(() => setPhDeleting(true), 1200);
		} else if (phDeleting && phPos > 0) {
			// deleting
			id = window.setTimeout(() => setPhPos((p) => Math.max(0, p - 1)), 28 + Math.random() * 40);
		} else {
			// move to next random name (avoid immediate repeat)
			id = window.setTimeout(() => {
				setPhDeleting(false);
				const len = pool.length;
				setPhIndex((i) => {
					if (len <= 1) return 0;
					let next = Math.floor(Math.random() * len);
					if (next === i) next = (next + 1) % len;
					return next;
				});
			}, 500);
		}
		return () => clearTimeout(id);
	}, [animActive, PLACEHOLDER_NAMES, phIndex, phPos, phDeleting]);

	// Force the Toolbar's input placeholder to our animated text (without changing Toolbar)
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const root = toolbarRef.current;
		if (!root) return;
		// Try to find the search input inside the Toolbar
		const input =
			(root.querySelector('input[aria-label*="search" i]') as HTMLInputElement) ||
			(root.querySelector('input[placeholder*="search" i]') as HTMLInputElement) ||
			(root.querySelector('input[type="search"]') as HTMLInputElement) ||
			(root.querySelector('input.MuiInputBase-input') as HTMLInputElement) ||
			(root.querySelector("input") as HTMLInputElement);

		// Only override when user isn't typing; browser hides placeholder when value exists anyway
		if (input && !searchInput) {
			input.setAttribute("placeholder", displayedPlaceholder);
		}
	}, [displayedPlaceholder, searchInput]);

	// UI
	return (
		<React.Fragment>
			<div style={{ padding: 30, paddingTop: 50, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18, position: "relative", zIndex: 1 }}>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ width: "100%", maxWidth: 1600, display: "flex", flexDirection: "column", gap: 16 }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", color: "transparent", textShadow: "0 0 12px rgba(124,58,237,0.18)" }}>Servers</h2>
							<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700, opacity: 0.95, fontSize: 16 }}>Browse and filter available servers</p>
						</div>

						{/* Toolbar */}
						<div ref={toolbarRef}>
							{(() => {
								const ToolbarAny = Toolbar as any;
								return (
									<ToolbarAny
										isFetching={isFetching}
										searchInput={searchInput}
										setSearchInput={setSearchInput}
										openFilter={openFilter}
										refreshNow={refreshNow}
										resetAll={resetAll}
										placeholder={displayedPlaceholder}
									/>
								);
							})()}
						</div>

						{/* Active filters bar */}
						<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 10px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
							<span style={{ fontWeight: 800, opacity: 0.9 }}>Active Filters:</span>
							{tier !== "All" && <Chip label={`Tier: ${tierLabel(tier)}`} onDelete={() => setTier("All")} size="small" />}
							{region !== "All" && <Chip label={`Region: ${region}`} onDelete={() => setRegion("All")} size="small" />}
							{selectedCarPacks.size > 0 && [...selectedCarPacks].map((c) => (
								<Chip key={c} label={`Pack: ${c}`} onDelete={() => { const nxt = new Set(selectedCarPacks); nxt.delete(c); setSelectedCarPacks(nxt); }} size="small" />
							))}
							{selectedMaps.size > 0 && [...selectedMaps].map((m) => (
								<Chip key={m} label={`Map: ${m}`} onDelete={() => { const nxt = new Set(selectedMaps); nxt.delete(m); setSelectedMaps(nxt); }} size="small" />
							))}
							{selectedTraffic.size > 0 && [...selectedTraffic].map((t) => (
								<Chip key={t} label={`Traffic: ${t}`} onDelete={() => { const nxt = new Set(selectedTraffic); nxt.delete(t); setSelectedTraffic(nxt); }} size="small" />
							))}
							{showOffline && <Chip label="Show Offline" onDelete={() => setShowOffline(false)} size="small" />}
							{(tier !== "All" || region !== "All" || selectedCarPacks.size || selectedMaps.size || selectedTraffic.size || showOffline) ? (
								<button onClick={clearFiltersInModal} style={{ marginLeft: "auto", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>Clear All</button>
							) : null}
						</div>
					</div>
				</div>

				{/* Countdown + totals */}
				<CountdownSummary
					secondsLeft={secondsLeft}
					isFetching={isFetching}
					totalPlayers={totalPlayers}
					totalMaxPlayers={totalMaxPlayers}
					filteredCount={filtered.length}
				/>

				{/* table */}
				<div style={{ width: "100%", maxWidth: 1600, margin: "0 auto", position: "relative" }}>
					{/* header */}
					<div style={{ background: "rgba(10,8,15,0.36)", border: "1px solid rgba(124,58,237,0.06)", padding: 12, color: "#fff", position: "sticky", top: 12, zIndex: 6, backdropFilter: "blur(6px)", borderRadius: 12 }}>
						<div style={{ display: "grid", gridTemplateColumns: "360px 180px 140px 180px 140px 140px 220px 140px", gap: 8, padding: "8px 12px", fontWeight: 800 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => handleSort("name")}>Server Name {orderBy === "name" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ cursor: "pointer" }} onClick={() => handleSort("tier")}>Tier {orderBy === "tier" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("region")}>Region {orderBy === "region" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("carPack")}>Car Pack {orderBy === "carPack" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("players")}>Players {orderBy === "players" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("trafficDensity")}>Traffic {orderBy === "trafficDensity" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => handleSort("map")}>Map {orderBy === "map" ? (orderDirection === "asc" ? "▲" : "▼") : null}</div>
							<div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
								<span style={{ fontWeight: 700, opacity: 0.85 }}>Rows</span>
								<Select
									value={pageSize}
									onChange={(e) => setPageSize(Number(e.target.value))}
									size="small"
									sx={{ minWidth: 72, height: 30, color: "#fff" }}
								>
									<MenuItem value={10}>10</MenuItem>
									<MenuItem value={25}>25</MenuItem>
									<MenuItem value={50}>50</MenuItem>
								</Select>
							</div>
						</div>
					</div>

					<div>
						{paginated.length === 0 && !isFetching ? (
							<div style={{ padding: 28, textAlign: "center", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>No servers found — try adjusting filters</div>
						) : (
							<>
								<style>{`
									.server-card {
										position: relative; overflow: hidden;
										display: grid; grid-template-columns: 360px 180px 140px 180px 140px 140px 220px 140px;
										align-items: center; gap: 8px; padding: 14px; margin-bottom: 12px;
										background: rgba(10,8,15,0.45); border-radius: 12px;
										border: 1px solid rgba(139,40,255,0.22);
										box-shadow: 0 8px 30px rgba(139,40,255,0.06), 0 0 18px rgba(139,40,255,0.06) inset;
										transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
									}
									.server-card::before {
										content: ""; position: absolute; inset: 0; width: 100%;
										background: linear-gradient(90deg, rgba(139,40,255,0.04), rgba(139,40,255,0.18), rgba(139,40,255,0.04));
										transform: translateX(-110%); transition: transform .48s ease; pointer-events: none; z-index: 1;
									}
									.server-card::after {
										content: "GET SLIDING"; position: absolute; inset: 0; width: 100%;
										display: flex; align-items: center; padding-left: 18px;
										font-weight: 1000; font-size: 22px; letter-spacing: 3px; color: rgba(255,255,255,0.9);
										text-shadow: 0 2px 10px rgba(139,40,255,0.45);
										background: linear-gradient(90deg, rgba(139,40,255,0.10), rgba(139,40,255,0.30), rgba(139,40,255,0.10));
										backdrop-filter: blur(2px);
										border-right: 1px solid rgba(139,40,255,0.26);
										transform: translateX(-110%); transition: transform 1.2s ease, opacity .5s ease; transition-delay: .08s;
										opacity: 0; pointer-events: none; z-index: 2;
									}
									.server-card:hover::before { transform: translateX(210%); }
									.server-card:hover::after { transform: translateX(210%); opacity: 1; }
									.server-card:hover {
										transform: translateY(-4px) translateX(2px);
										box-shadow: 0 18px 50px rgba(139,40,255,0.12), 0 0 28px rgba(139,40,255,0.12) inset;
										border-color: rgba(139,40,255,0.36);
									}
									.server-card.changed { animation: row-flash 2.2s ease; box-shadow: 0 20px 48px rgba(124,58,237,0.12), 0 0 24px rgba(124,58,237,0.06) inset; }
									@keyframes row-flash {
										0% { background: linear-gradient(90deg, rgba(34,197,94,0.12), rgba(124,58,237,0.06)); transform: translateY(-2px); }
										40% { background: rgba(10,8,15,0.62); transform: translateY(0); }
										100% { background: rgba(10,8,15,0.45); transform: translateY(0); }
									}
								`}</style>

								{isFetching && paginated.length === 0
									? Array.from({ length: Math.min(8, pageSize) }).map((_, i) => (
										<div key={`skeleton-${i}`} className="server-card">
											<Skeleton variant="rectangular" height={72} sx={{ gridColumn: "1 / -1", bgcolor: "rgba(255,255,255,0.06)" }} />
										</div>
									  ))
									: paginated.map((s) => (
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

					{/* footer with page size + pagination */}
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.9 }}>
							<span style={{ fontWeight: 700 }}>Rows per page:</span>
							<Select
								value={pageSize}
								onChange={(e) => setPageSize(Number(e.target.value))}
								size="small"
								sx={{ minWidth: 72, height: 30, color: "#fff" }}
							>
								<MenuItem value={10}>10</MenuItem>
								<MenuItem value={25}>25</MenuItem>
								<MenuItem value={50}>50</MenuItem>
							</Select>
						</div>
						<Pagination count={pageCount} page={pageIdx} onChange={(_, v) => setPageIdx(v)} color="primary" siblingCount={1} boundaryCount={1} showFirstButton showLastButton sx={{ "& .MuiPaginationItem-root": { color: "#fff" }, "& .Mui-selected": { background: "#7c3aed" } }} />
					</div>
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

				{/* Inline Offline Modal with "Join anyway" */}
				<Dialog
					open={offlineModalOpen}
					onClose={closeOfflineModal}
					PaperProps={{ sx: { bgcolor: "rgba(20,18,26,0.96)", border: "1px solid rgba(124,58,237,0.25)", color: "#fff" } }}
				>
					<DialogTitle sx={{ fontWeight: 900 }}>Server appears offline</DialogTitle>
					<DialogContent sx={{ opacity: 0.95 }}>
						{offlineServerName ? `“${offlineServerName}” seems to be offline right now.` : "This server seems to be offline right now."}
						<br />
						You can still try to join via Content Manager.
					</DialogContent>
					<DialogActions sx={{ p: 2, gap: 1 }}>
						<Button onClick={closeOfflineModal} variant="text" sx={{ color: "#fff" }}>Close</Button>
						<Button onClick={joinAnyway} variant="contained" sx={{ background: "#7c3aed", "&:hover": { background: "#6d28d9" } }}>
							Join anyway
						</Button>
					</DialogActions>
				</Dialog>

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

		// Other common keys as fallback (expanded)
		const nums = (keys: string[]) => keys.find((k) => typeof b?.[k] === "number") as string | undefined;
		const playersKey = nums([
			"clients","Clients","players","Players","currentPlayers","playersCount","playerCount",
			"connected","DriverCount","drivercount","carCount","NumPlayers","numplayers","online","OnlinePlayers","Current"
		]);
		const maxKey = nums([
			"maxclients","maxClients","maxPlayers","MaxPlayers","max","max_players","capacity","slots","max_slots","MaxClients","Capacity"
		]);
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
	// Try multiple common endpoints — expanded
	const paths = [
		"/info", "/INFO", "/info?json=1",
		"/json", "/JSON", "/statusJSON",
		"/status", "/status.json", "/players.json",
		"/api/info", "/api/status", "/api/session",
		"/entrylist", "/api/entrylist", "/session",
		"/players", "/clients", "/server/status", "/live/status",
	];

	// Build candidate list; if we have a working hint, try it first
	const candidates: Array<{ base: string; path: string; protocol: "http" | "https" }> = [];
	if (hint) candidates.push(hint);
	for (const base of bases) {
		for (const path of paths) {
			const protocol = base.startsWith("https://") ? "https" : "http";
			if (hint && hint.base === base && hint.path === path) continue;
			candidates.push({ base, path, protocol });
		}
	}

	for (const cand of candidates) {
		const { base, path, protocol } = cand;
		const url = `${base}${path}`;
		const isInfo = path.toLowerCase().startsWith("/info");
		const isHttps = protocol === "https";
		const proxied = (tmo: number) => `/api/proxy?u=${encodeURIComponent(url)}&t=${tmo}&q=1`;
		const attempts = isInfo ? 2 : 1;
		for (let attempt = 0; attempt < attempts; attempt++) {
			let tmo = isInfo
				? (attempt === 0 ? Math.max(2000, perRequestTimeout) : Math.max(5000, perRequestTimeout * 2))
				: perRequestTimeout;
			if (isHttps) tmo = attempt === 0 ? Math.max(tmo, 3500) : Math.max(tmo, 6000);

			try {
				const res = await fetchWithTimeout(proxied(tmo), tmo + 1500);
				if (!res.ok) continue;

				const ct = (res.headers.get("content-type") || "").toLowerCase();
				let body: any = null;
				if (ct.includes("application/json") || ct.includes("text/json")) {
					body = await res.json().catch(() => null);
				} else {
					const text = await res.text();
					try { body = JSON.parse(text); } catch { body = null; }
				}
				if (body) {
					const counts = deriveCounts(body, s);
					if (counts) {
						return { ...counts, chosen: cand };
					}
				}
			} catch {
				// ignore and try next candidate
			}
		}
	}
	return undefined;
}

function makeCmUrl(s: Server): string {
	// Use host from config when provided; otherwise fall back to DEFAULT_IP.
	const host = (s.host && s.host.trim().length > 0) ? s.host.trim() : DEFAULT_IP;
	// Always use the server's httpPort from config.
	const port = s.httpPort;
	return `acmanager://race/online/join?ip=${encodeURIComponent(host)}&httpPort=${encodeURIComponent(String(port))}`;
}
