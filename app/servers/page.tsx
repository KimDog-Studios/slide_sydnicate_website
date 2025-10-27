"use client"
import React, { useEffect, useMemo, useState } from "react"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import TableContainer from "@mui/material/TableContainer"
import Table from "@mui/material/Table"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import TableBody from "@mui/material/TableBody"
import Paper from "@mui/material/Paper"
import TableSortLabel from "@mui/material/TableSortLabel"

// NEW imports for popovers / controls & pagination + icons
import Button from "@mui/material/Button"
import Popover from "@mui/material/Popover"
import MenuList from "@mui/material/MenuList"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Stack from "@mui/material/Stack"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Popper from "@mui/material/Popper"
import Pagination from "@mui/material/Pagination"

import SearchIcon from "@mui/icons-material/Search"
import SortIcon from "@mui/icons-material/Sort"
import FilterListIcon from "@mui/icons-material/FilterList"
import FavoriteIcon from "@mui/icons-material/Favorite"
import RefreshIcon from "@mui/icons-material/Refresh"
import PeopleIcon from "@mui/icons-material/People"
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar"
import PublicIcon from "@mui/icons-material/Public"
import MapIcon from "@mui/icons-material/Map"
import TrafficIcon from "@mui/icons-material/Traffic"
import StarIcon from "@mui/icons-material/Star"

// add config imports
import { DEFAULT_IP, SERVERS, type Server } from "./config"

// restore carPack to sortable keys
// filepath change: OrderKey no longer includes "carPack"
type OrderKey = "name" | "tier" | "region" | "carPack" | "players" | "trafficDensity" | "map"

export default function page() {
	// filters / controls
	const [searchName, setSearchName] = useState("")
	const [tier, setTier] = useState<string>("All")
	const [region, setRegion] = useState<string>("All")
	const [minPlayers, setMinPlayers] = useState<number>(0)
	const [maxPlayers, setMaxPlayers] = useState<number>(32)
	const [traffic, setTraffic] = useState<string>("All")
	const [mapFilter, setMapFilter] = useState<string>("All")

	// sorting state - default to alphabetical
	const [orderBy, setOrderBy] = useState<OrderKey>("name")
	const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc")

	// NEW: favourites
	const [favourites, setFavourites] = useState<Record<string, true>>({})

	// NEW: popover anchors
	const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null)
	const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
	const [favAnchor, setFavAnchor] = useState<HTMLElement | null>(null)

	// NEW: multi-select filter state (required by filtering logic)
	const [selectedCarPacks, setSelectedCarPacks] = useState<Set<string>>(new Set())
	const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set())
	const [selectedTraffic, setSelectedTraffic] = useState<Set<string>>(new Set())

	// NEW: modal's internal search to filter filter-options
	const [filterSearch, setFilterSearch] = useState<string>("")

	// helper to toggle items in a Set stored in state
	const toggleSet = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
		const copy = new Set(set)
		if (copy.has(value)) copy.delete(value)
		else copy.add(value)
		setter(copy)
	}
	
	// PAGINATION state (new)
	const [page, setPage] = useState<number>(1)
	const PAGE_SIZE = 10
	const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => setPage(value)

	// derive unique lists
	const tiers = useMemo(() => ["All", ...Array.from(new Set(SERVERS.map((s) => s.tier)))] , [])
	const regions = useMemo(() => ["All", ...Array.from(new Set(SERVERS.map((s) => s.region)))] , [])
	const maps = useMemo(() => ["All", ...Array.from(new Set(SERVERS.map((s) => s.map)))] , [])
	const carPacks = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.carPack ?? "Default"))).sort(), [])
	const trafficOptions = useMemo(() => Array.from(new Set(SERVERS.map((s) => s.trafficDensity))).sort(), [])

	const filtered = useMemo(() => {
		return SERVERS.filter((s) => {
			if (searchName && !s.name.toLowerCase().includes(searchName.toLowerCase())) return false
			if (tier !== "All" && s.tier !== tier) return false
			if (region !== "All" && s.region !== region) return false
			// multi-select traffic: if any selected, require inclusion
			if (selectedTraffic.size > 0 && !selectedTraffic.has(s.trafficDensity)) return false
			// multi-select car packs
			if (selectedCarPacks.size > 0 && !selectedCarPacks.has(s.carPack ?? "Default")) return false
			// multi-select maps
			if (selectedMaps.size > 0 && !selectedMaps.has(s.map)) return false
			if (s.players < minPlayers || s.players > maxPlayers) return false
			return true
		})
	}, [searchName, tier, region, minPlayers, maxPlayers, selectedTraffic, selectedCarPacks, selectedMaps])

	// compute total players shown (used next to Reset Filters)
	const totalPlayers = useMemo(() => filtered.reduce((sum, s) => sum + s.players, 0), [filtered])

	// sort helper (handle carPack)
	const handleRequestSort = (property: OrderKey) => {
		const isAsc = orderBy === property && orderDirection === "asc"
		setOrderDirection(isAsc ? "desc" : "asc")
		setOrderBy(property)
	}

	const displayed = useMemo(() => {
		const arr = [...filtered]
		arr.sort((a, b) => {
			let cmp = 0
			if (orderBy === "players") {
				cmp = a.players - b.players
			} else {
				// support carPack as string key as well
				const va = String((a as any)[orderBy] ?? "").toLowerCase()
				const vb = String((b as any)[orderBy] ?? "").toLowerCase()
				if (va < vb) cmp = -1
				else if (va > vb) cmp = 1
				else cmp = 0
			}
			// deterministic tie-breaker: always fallback to name comparison if primary compare equal
			if (cmp === 0) {
				const na = a.name.toLowerCase()
				const nb = b.name.toLowerCase()
				if (na < nb) cmp = -1
				else if (na > nb) cmp = 1
				else cmp = 0
			}
			return orderDirection === "asc" ? cmp : -cmp
		})
		return arr
	}, [filtered, orderBy, orderDirection])

	// reset page when filters change (new)
	useEffect(() => {
		setPage(1)
	}, [searchName, tier, region, minPlayers, maxPlayers, traffic, mapFilter])

	// pagination slice (new)
	const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
	const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	// NEW: popover handlers
	const openSort = (e: React.MouseEvent<HTMLElement>) => setSortAnchor(e.currentTarget)
	const closeSort = () => setSortAnchor(null)
	// modal flag for centered filter panel
	const [filterModalOpen, setFilterModalOpen] = useState(false)
	const openFilter = (e: React.MouseEvent<HTMLElement>) => {
		setFilterAnchor(e.currentTarget)
		setFilterModalOpen(true)
	}
	const closeFilter = () => {
		setFilterAnchor(null)
		setFilterModalOpen(false)
	}
	const openFav = (e: React.MouseEvent<HTMLElement>) => setFavAnchor(e.currentTarget)
	const closeFav = () => setFavAnchor(null)

	// NEW: toggle favourite server
	const toggleFav = (id: string) => {
		setFavourites((prev) => {
			const copy = { ...prev }
			if (copy[id]) delete copy[id]
			else copy[id] = true
			return copy
		})
	}

	// NEW: reset filters
	const resetFilters = () => {
		setSearchName("")
		setTier("All")
		setRegion("All")
		setTraffic("All")
		setMapFilter("All")
		setSelectedCarPacks(new Set())
		setSelectedMaps(new Set())
		setSelectedTraffic(new Set())
		setMinPlayers(0)
		setMaxPlayers(32)
		setOrderBy("players")
		setOrderDirection("desc")
	}

	return (
		<div style={{ padding: 24, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", gap: 18 }}>
			{/* Header */}
			<header style={{ marginBottom: 18 }}>
				<h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, textShadow: "0 0 8px rgba(124,58,237,0.9)" }}>
					Servers
				</h2>
				<p style={{ marginTop: 6, marginBottom: 0, fontWeight: 700 }}>Browse and filter available servers</p>
			</header>

			{/* Centered toolbar matching table width (icons added) */}
			<div style={{ display: "flex", justifyContent: "center" }}>
				<div
					style={{
						width: "100%",
						maxWidth: 1600,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 8,
						padding: "0 4px",
						boxSizing: "border-box", // ensure padding doesn't shift layout
					}}
				>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						{/* Search with icon */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 1, background: "rgba(0,0,0,0.45)", p: "4px 8px", borderRadius: 1 }}>
							<SearchIcon sx={{ color: "#fff" }} />
							<TextField
								variant="standard"
								placeholder="Search server name..."
								value={searchName}
								onChange={(e) => setSearchName(e.target.value)}
								size="small"
								InputProps={{ disableUnderline: true, sx: { color: "#fff" } }}
								sx={{ minWidth: 220 }}
							/>
						</Box>

						<Button size="small" variant="outlined" onClick={openSort} startIcon={<SortIcon />} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.06)" }}>
							Sort By Car
						</Button>

						<Button size="small" variant="outlined" onClick={openFilter} startIcon={<FilterListIcon />} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.06)" }}>
							Filter By
						</Button>

						<Button size="small" variant="outlined" onClick={openFav} startIcon={<FavoriteIcon />} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.06)" }}>
							Favourite Servers
						</Button>
					</div>

					{/* Reset + total players display */}
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<Button size="small" variant="contained" onClick={resetFilters} startIcon={<RefreshIcon />} sx={{ background: "#7c3aed", fontSize: 13 }}>
							Reset Filters
						</Button>

						<Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#fff", opacity: 0.95 }}>
							<PeopleIcon />
							<span style={{ fontWeight: 800 }}>{totalPlayers}</span>
						</Box>
					</div>
				</div>
			</div>

			{/* Popovers (Filter popover added) */}
			{filterModalOpen && (
				<div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
					{/* blurred dim backdrop */}
					<div
						onClick={closeFilter}
						style={{
							position: 'absolute',
							inset: 0,
							background: 'rgba(0,0,0,0.45)',
							backdropFilter: 'blur(6px)',
							WebkitBackdropFilter: 'blur(6px)',
						}}
					/>

					{/* centered, taller opaque panel */}
					<div
						role="dialog"
						aria-modal="true"
						style={{
							position: 'relative',
							width: 720,
							maxWidth: 'calc(100% - 32px)',
							height: '80vh',           // taller modal
							borderRadius: 12,
							background: '#07070b',    // opaque background
							color: '#fff',
							boxShadow: '0 30px 80px rgba(2,6,23,0.8)',
							display: 'flex',
							flexDirection: 'column',
							overflow: 'hidden',
						}}
					>
						{/* Header (unchanged except modal search binding) */}
						<div style={{ padding: '20px 20px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
								<div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>FILTER</div>
							</div>
							<div style={{ marginTop: 12 }}>
								<TextField
									placeholder="Search Filters"
									variant="filled"
									size="small"
									fullWidth
									value={filterSearch}
									onChange={(e) => setFilterSearch(e.target.value)}
									InputProps={{
										disableUnderline: true,
										sx: {
											background: '#0f0f10',
											borderRadius: 1,
											color: '#fff',
											px: 1,
											'& input': { color: '#fff' },
										},
										startAdornment: <SearchIcon sx={{ color: 'rgba(255,255,255,0.45)', mr: 1 }} />,
									}}
								/>
							</div>
						</div>

						{/* Body now flexes and scrolls within the taller modal */}
						<div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
							{/* Region */}
							<section style={{ padding: 16, borderRadius: 10 }}>
								<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Region</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									{regions
										.filter(r => r !== 'All')
										.filter(r => filterSearch.trim() === "" || r.toLowerCase().includes(filterSearch.toLowerCase()))
										.map((r) => (
											<label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}>
												<input type="checkbox" checked={selectedMaps.has(r)} onChange={() => toggleSet(selectedMaps, r, setSelectedMaps)} />
												{/* show only the EU flag (larger) for EU, otherwise show the region name */}
												{r === "EU" ? (
													<img
														src="https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/Flag_of_Europe.svg.png"
														alt=""
														aria-hidden="true"
														style={{ width: 28, height: 18, objectFit: 'contain', marginLeft: 6 }}
													/>
												) : (
													<span style={{ marginLeft: 6 }}>{r}</span>
												)}
											</label>
										))}
								</div>
							</section>

							{/* Traffic Density */}
							<section style={{ padding: 16, borderRadius: 10 }}>
								<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Traffic Density</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									{trafficOptions
										.filter(t => filterSearch.trim() === "" || t.toLowerCase().includes(filterSearch.toLowerCase()))
										.map((t) => (
											<label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
												<input type="checkbox" checked={selectedTraffic.has(t)} onChange={() => toggleSet(selectedTraffic, t, setSelectedTraffic)} />
												<span>{t}</span>
											</label>
										))}
								</div>
							</section>

							{/* Tier */}
							<section style={{ padding: 16, borderRadius: 10 }}>
								<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Tier</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									{tiers
										.filter(ti => ti !== 'All')
										.filter(ti => filterSearch.trim() === "" || ti.toLowerCase().includes(filterSearch.toLowerCase()))
										.map((ti) => (
											<label key={ti} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
												<input type="checkbox" checked={selectedCarPacks.has(ti)} onChange={() => toggleSet(selectedCarPacks, ti, setSelectedCarPacks)} />
												<span>{ti}</span>
											</label>
										))}
								</div>
							</section>

							{/* Map */}
							<section style={{ padding: 16, borderRadius: 10 }}>
								<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Map</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									{maps
										.filter(m => m !== 'All')
										.filter(m => filterSearch.trim() === "" || m.toLowerCase().includes(filterSearch.toLowerCase()))
										.map((m) => (
											<label key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
												<input type="checkbox" checked={selectedMaps.has(m)} onChange={() => toggleSet(selectedMaps, m, setSelectedMaps)} />
												<span>{m}</span>
											</label>
										))}
								</div>
							</section>

							{/* Car Pack */}
							<section style={{ padding: 16, borderRadius: 10 }}>
								<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Car Pack</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									{carPacks
										.filter(c => filterSearch.trim() === "" || c.toLowerCase().includes(filterSearch.toLowerCase()))
										.map((c) => (
											<label key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
												<input type="checkbox" checked={selectedCarPacks.has(c)} onChange={() => toggleSet(selectedCarPacks, c, setSelectedCarPacks)} />
												<span>{c}</span>
											</label>
										))}
								</div>
							</section>
						</div>

						{/* Footer (unchanged) */}
						<div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
							<button
								onClick={() => { setSelectedCarPacks(new Set()); setSelectedMaps(new Set()); setSelectedTraffic(new Set()); }}
								style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 800 }}
							>
								CLEAR FILTER
							</button>

							<button
								onClick={() => closeFilter()}
								style={{ padding: '10px 20px', borderRadius: 10, background: '#a21caf', color: '#fff', border: 'none', fontWeight: 900, boxShadow: '0 6px 22px rgba(124,58,237,0.32)' }}
							>
								APPLY
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Results summary */}
			<div style={{ marginTop: 6, fontWeight: 800 }}>
				{filtered.length} server{filtered.length !== 1 ? "s" : ""} found
			</div>

			{/* Server list — replace MUI Table with fixed-grid implementation */}
			<div style={{ width: "100%", maxWidth: 1600, margin: "0 auto", boxSizing: "border-box" }}>
				{/* grid header */}
				<div
					role="table"
					aria-label="servers"
					style={{
						background: "rgba(10,8,15,0.36)",
						border: "1px solid rgba(124,58,237,0.06)",
						boxShadow: "0 10px 30px rgba(2,6,23,0.6)",
						padding: 12,
						color: "#fff",
					}}
				>
					{/* column sizes must match below rows */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "360px 120px 140px 180px 140px 140px 220px 140px",
							alignItems: "center",
							gap: 8,
							padding: "8px 12px",
							borderBottom: "1px solid rgba(255,255,255,0.06)",
							fontWeight: 800,
							fontSize: 15,
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<StarIcon sx={{ color: "#fff" }} />
							<span>Server Name</span>
						</div>
						<div>Tier</div>
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}><PublicIcon sx={{ color: "#fff" }} />Region</div>
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}><DirectionsCarIcon sx={{ color: "#fff" }} />Car Pack</div>
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}><PeopleIcon sx={{ color: "#fff" }} />Players</div>
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}><TrafficIcon sx={{ color: "#fff" }} />Traffic</div>
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapIcon sx={{ color: "#fff" }} />Map</div>
						<div style={{ textAlign: "right" }}>Action</div>
					</div>

					{/* rows */}
					<div>
						{paginated.length === 0 ? (
							<div style={{ padding: 28, textAlign: "center", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
								No servers found — try adjusting filters
							</div>
						) : (
							paginated.map((s) => {
								const joinUrl = `https://acstuff.ru/s/q:race/online/join?ip=${encodeURIComponent(DEFAULT_IP)}&httpPort=${encodeURIComponent(String(s.httpPort))}`
								return (
									<div
										key={s.id}
										role="row"
										style={{
											display: "grid",
											gridTemplateColumns: "360px 120px 140px 180px 140px 140px 220px 140px",
											alignItems: "center",
											gap: 8,
											padding: "12px",
											borderBottom: "1px solid rgba(255,255,255,0.03)",
										}}
									>
										{/* Server Name cell (flex so text truncates without pushing columns) */}
										<div role="cell" style={{ minWidth: 0 }}>
											<div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
												{ s.thumbnail ? (
													<img
														src={s.thumbnail}
														alt={s.name}
														style={{ width: 80, height: 48, flex: "0 0 80px", objectFit: "cover", borderRadius: 4 }}
													/>
												) : (
													<div style={{ width: 80, height: 48, flex: "0 0 80px", background: "linear-gradient(90deg,#0f172a,#24123b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", borderRadius: 4, fontSize: 14 }}>
														{s.map.split(" ").slice(0,2).map((w)=>w[0]).join("")}
													</div>
												) }
												<div style={{ minWidth: 0, overflow: "hidden" }}>
													<div style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
													<div style={{ fontSize: 13, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.map}</div>
												</div>
											</div>
										</div>

										{/* Tier */}
										<div role="cell" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.tier}</div>

										{/* Region */}
										<div role="cell" style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
											<PublicIcon fontSize="small" />
											{/* show only flag for EU (slightly larger) otherwise show region text */}
											{ s.region === "EU" ? (
												<img
													src="https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/Flag_of_Europe.svg.png"
													alt=""
													aria-hidden="true"
													style={{ width: 22, height: 14, objectFit: 'contain' }}
												/>
											) : (
												<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.region}</span>
											)}
										</div>

										{/* Car Pack */}
										<div role="cell" style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
											<DirectionsCarIcon fontSize="small" />
											<span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.carPack ?? "Default Pack"}</span>
										</div>

										{/* Players */}
										<div role="cell" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
											<PeopleIcon fontSize="small" style={{ marginRight: 6 }} />
											{s.players}/{s.maxPlayers}
										</div>

										{/* Traffic */}
										<div role="cell" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
											<TrafficIcon fontSize="small" style={{ marginRight: 6 }} />
											{s.trafficDensity}
										</div>

										{/* Map */}
										<div role="cell" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
											<MapIcon fontSize="small" style={{ marginRight: 6 }} />
											{s.map}
										</div>

										{/* Action: fav + join */}
										<div role="cell" style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 8 }}>
											<IconButton
												size="small"
												onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(s.id) }}
												aria-pressed={Boolean(favourites[s.id])}
												sx={{ color: favourites[s.id] ? "#ffd700" : "#fff", borderRadius: 1, "&:hover": { backgroundColor: "rgba(255,215,0,0.06)" } }}
												title={favourites[s.id] ? "Remove favourite" : "Add favourite"}
											>
												<StarIcon />
											</IconButton>

											<a href={joinUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 12px", borderRadius: 6, textDecoration: "none", background: "#7c3aed", color: "#fff", fontWeight: 800 }}>
												Join
											</a>
										</div>
									</div>
								)
							})
						)}
					</div>

					{/* pagination below the grid */}
					<div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
						<Pagination
							count={pageCount}
							page={page}
							onChange={handlePageChange}
							color="primary"
							siblingCount={1}
							boundaryCount={1}
							showFirstButton
							showLastButton
							sx={{
								"& .MuiPaginationItem-root": { color: "#fff", background: "transparent", borderRadius: 1 },
								"& .Mui-selected": { background: "#7c3aed" },
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}