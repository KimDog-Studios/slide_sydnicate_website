export type Server = {
	id: string
	name: string
	tier: "Public" | "Bronze" | "Silver" | "Gold" | "Platinum"
	region: string
	players: number
	maxPlayers: number
	trafficDensity: "None" | "Low" | "Medium" | "High"
	map: string
	thumbnail?: string
	httpPort: number
	carPack?: string
	// optional per-server HTTP host (e.g. specific IP or hostname). If omitted, DEFAULT_IP is used.
	host?: string
}

export const DEFAULT_IP = "45.141.36.126"

// Servers taken from your Discord bot JSON; grouped entries use group's Title as carPack and ThumbnailUrl as thumbnail.
// players/maxPlayers/trafficDensity are defaulted where not provided.
export const SERVERS: Server[] = [
	// ==========================================
	// 🏁 Slide Syndicate — KimDog Street Servers
	// ==========================================
	{ id: "syndicate_drift_0", name: "Adam LZ Compound", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Adam LZ Compound", httpPort: 9100, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_1", name: "Backwoods", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Backwoods", httpPort: 9101, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_2", name: "Brooklyn Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park", httpPort: 9102, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_3", name: "Brooklyn Park Remastered", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park Remastered", httpPort: 9103, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_4", name: "CG Bashlands", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Bashlands", httpPort: 9104, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_5", name: "CG Sequoia Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sequoia Park", httpPort: 9105, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_6", name: "CG Sunrise Drift V2", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sunrise Drift V2", httpPort: 9106, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_7", name: "Drift Playground", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Drift Playground", httpPort: 9107, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_8", name: "Ebisu Complex", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Complex", httpPort: 9108, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_9", name: "Ebisu Minami", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Minami", httpPort: 9109, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_10", name: "Ebisu Nishi Long", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Nishi Long", httpPort: 9110, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_11", name: "Ebisu North Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu North Course", httpPort: 9111, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_12", name: "Ebisu School Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu School Course", httpPort: 9112, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_13", name: "Fort 51", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Fort 51", httpPort: 9113, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_14", name: "Full Send Drift Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Full Send Drift Park", httpPort: 9114, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_15", name: "Grange Motor Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Grange Motor Circuit", httpPort: 9115, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_16", name: "Klutch Kickers", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers", httpPort: 9116, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_17", name: "Klutch Kickers Winter", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers Winter", httpPort: 9117, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_18", name: "Kunitomi Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Kunitomi Circuit", httpPort: 9118, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_19", name: "Minecraft World", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Minecraft World", httpPort: 9119, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_20", name: "Nexus City", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Nexus City", httpPort: 9120, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_21", name: "OI Wharf", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "OI Wharf", httpPort: 9121, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_22", name: "Owara", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Owara", httpPort: 9122, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_23", name: "Shibuya Drift", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Shibuya Drift", httpPort: 9123, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_24", name: "Steel Yard", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Steel Yard", httpPort: 9124, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_25", name: "Tamworth UK Streets", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Tamworth UK Streets", httpPort: 9125, carPack: "KimDogStreet", thumbnail: "..." },
	{ id: "syndicate_drift_26", name: "Total Drift Challenge", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Total Drift Challenge", httpPort: 9126, carPack: "KimDogStreet", thumbnail: "..." },
	// ==========================================
	// 🏁 Slide Syndicate — SimHQ Servers
	// ==========================================
	{ id: "syndicate_simhq_0", name: "Adam LZ Compound", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Adam LZ Compound", httpPort: 9500, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_0", name: "Backwoods", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Backwoods", httpPort: 9501, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_1", name: "Brooklyn Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park", httpPort: 9502, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_2", name: "Brooklyn Park Remastered", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park Remastered", httpPort: 9503, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_cg_0", name: "CG Bashlands", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Bashlands", httpPort: 9504, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_cg_1", name: "CG Sequoia Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sequoia Park", httpPort: 9505, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_cg_2", name: "CG Sunrise Drift V2", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sunrise Drift V2", httpPort: 9506, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_1", name: "Drift Playground", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Drift Playground", httpPort: 9507, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_perma_0", name: "Ebisu Complex", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Complex", httpPort: 9508, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_perma_1", name: "Ebisu Minami", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Minami", httpPort: 9509, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_perma_2", name: "Ebisu Nishi Long", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Nishi Long", httpPort: 9510, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_perma_3", name: "Ebisu North Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu North Course", httpPort: 9511, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_perma_4", name: "Ebisu School Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu School Course", httpPort: 9512, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_3", name: "Fort 51", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Fort 51", httpPort: 9513, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_4", name: "Full Send Drift Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Full Send Drift Park", httpPort: 9514, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_3", name: "Grange Motor Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Grange Motor Circuit", httpPort: 9515, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_4", name: "Klutch Kickers", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers", httpPort: 9516, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_adc_1", name: "Klutch Kickers Winter", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers Winter", httpPort: 9517, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_5", name: "Kunitomi Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Kunitomi Circuit", httpPort: 9518, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_6", name: "Minecraft World", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Minecraft World", httpPort: 9519, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_7", name: "Nexus City", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Nexus City", httpPort: 9520, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_8", name: "OI Wharf", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "OI Wharf", httpPort: 9521, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_9", name: "Owara", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Owara", httpPort: 9522, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_7", name: "Shibuya Drift", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Shibuya Drift", httpPort: 9523, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_10", name: "Steel Yard", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Steel Yard", httpPort: 9524, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_11", name: "Tamworth UK Streets", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Tamworth UK Streets", httpPort: 9525, carPack: "SimHQ", thumbnail: "..." },
	{ id: "syndicate_simhq_ct_12", name: "Total Drift Challenge", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Total Drift Challenge", httpPort: 9526, carPack: "SimHQ", thumbnail: "..." },
	// ==========================================
	// 🏁 Slide Syndicate — Gravy Garage Servers
	// ==========================================
	{ id: "syndicate_gravy_0", name: "ADC Klutch Kickers", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "ADC Klutch Kickers", httpPort: 9316, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_1", name: "Adam LZ Compound", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Adam LZ Compound", httpPort: 9300, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_2", name: "Backwoods", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Backwoods", httpPort: 9301, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_3", name: "Brooklyn Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park", httpPort: 9302, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_4", name: "Brooklyn Park Remastered", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park Remastered", httpPort: 9303, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_5", name: "CG Bashlands", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Bashlands", httpPort: 9304, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_6", name: "CG Sequoia Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sequoia Park", httpPort: 9305, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_7", name: "CG Sunrise Drift V2", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sunrise Drift V2", httpPort: 9306, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_8", name: "Drift Playground", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Drift Playground", httpPort: 9307, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_9", name: "Ebisu Complex", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Complex", httpPort: 9308, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_10", name: "Ebisu Minami", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Minami", httpPort: 9309, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_11", name: "Ebisu Nishi Long", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Nishi Long", httpPort: 9310, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_12", name: "Ebisu North Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu North Course", httpPort: 9311, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_13", name: "Ebisu School Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu School Course", httpPort: 9312, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_14", name: "Fort 51", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Fort 51", httpPort: 9313, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_15", name: "Full Send Drift Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Full Send Drift Park", httpPort: 9314, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_16", name: "Grange Motor Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Grange Motor Circuit", httpPort: 9315, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_17", name: "Klutch Kickers Winter", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers Winter", httpPort: 9317, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_18", name: "Kunitomi Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Kunitomi Circuit", httpPort: 9318, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_19", name: "Minecraft World", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Minecraft World", httpPort: 9319, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_20", name: "Nexus City", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Nexus City", httpPort: 9320, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_21", name: "OI Wharf", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "OI Wharf", httpPort: 9321, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_22", name: "Owara", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Owara", httpPort: 9322, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_23", name: "Shibuya Drift", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Shibuya Drift", httpPort: 9323, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_24", name: "Steel Yard", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Steel Yard", httpPort: 9324, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_25", name: "Tamworth UK Streets", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Tamworth UK Streets", httpPort: 9325, carPack: "GravyGarage", thumbnail: "..." },
	{ id: "syndicate_gravy_26", name: "Total Drift Challenge", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Total Drift Challenge", httpPort: 9326, carPack: "GravyGarage", thumbnail: "..." },
	// ==========================================
	// 🏁 Slide Syndicate — WDTS Servers
	// ==========================================
	{ id: "syndicate_wdts_0", name: "Adam LZ Compound", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Adam LZ Compound", httpPort: 9700, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_1", name: "Backwoods", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Backwoods", httpPort: 9701, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_2", name: "Brooklyn Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park", httpPort: 9702, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_3", name: "Brooklyn Park Remastered", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Brooklyn Park Remastered", httpPort: 9703, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_4", name: "CG Bashlands", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Bashlands", httpPort: 9704, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_5", name: "CG Sequoia Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sequoia Park", httpPort: 9705, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_6", name: "CG Sunrise Drift V2", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "CG Sunrise Drift V2", httpPort: 9706, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_7", name: "Drift Playground", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Drift Playground", httpPort: 9707, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_8", name: "Ebisu Complex", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Complex", httpPort: 9708, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_9", name: "Ebisu Minami", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Minami", httpPort: 9709, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_10", name: "Ebisu Nishi Long", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu Nishi Long", httpPort: 9710, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_11", name: "Ebisu North Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu North Course", httpPort: 9711, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_12", name: "Ebisu School Course", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Ebisu School Course", httpPort: 9712, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_13", name: "Fort 51", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Fort 51", httpPort: 9713, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_14", name: "Full Send Drift Park", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Full Send Drift Park", httpPort: 9714, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_15", name: "Grange Motor Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Grange Motor Circuit", httpPort: 9715, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_16", name: "Klutch Kickers", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers", httpPort: 9716, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_17", name: "Klutch Kickers Winter", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Klutch Kickers Winter", httpPort: 9717, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_18", name: "Kunitomi Circuit", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Kunitomi Circuit", httpPort: 9718, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_19", name: "Minecraft World", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Minecraft World", httpPort: 9719, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_20", name: "Nexus City", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Nexus City", httpPort: 9720, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_21", name: "OI Wharf", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "OI Wharf", httpPort: 9721, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_22", name: "Owara", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Owara", httpPort: 9722, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_23", name: "Shibuya Drift", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Shibuya Drift", httpPort: 9723, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_24", name: "Steel Yard", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Steel Yard", httpPort: 9724, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_25", name: "Tamworth UK Streets", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Tamworth UK Streets", httpPort: 9725, carPack: "WDTS", thumbnail: "..." },
	{ id: "syndicate_wdts_26", name: "Total Drift Challenge", tier: "Public", region: "EU", players: 0, maxPlayers: 32, trafficDensity: "Low", map: "Total Drift Challenge", httpPort: 9726, carPack: "WDTS", thumbnail: "..." },

	];

// set thumbnails for all KimDogStreet servers
const KIMDOG_STREET_THUMBNAIL = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Loading_Screens/163189863_1729626497216735_1524780481741060968_n.jpg";
for (const s of SERVERS) {
	if (s.carPack === "KimDogStreet") {
		s.thumbnail = KIMDOG_STREET_THUMBNAIL;
	}
}

// set thumbnails for SimHQ, GravyGarage, and WDTS servers
const SIMHQ_THUMBNAIL = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/Default.jpg";
for (const s of SERVERS) {
	if (s.carPack === "SimHQ") {
		s.thumbnail = SIMHQ_THUMBNAIL;
	}
}

const GRAVY_GARAGE_THUMBNAIL = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/16771109507482.png";
for (const s of SERVERS) {
	if (s.carPack === "GravyGarage") {
		s.thumbnail = GRAVY_GARAGE_THUMBNAIL;
	}
}

const WDTS_THUMBNAIL = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/wdtstreetpack11.jpg";
for (const s of SERVERS) {
	if (s.carPack === "WDTS") {
		s.thumbnail = WDTS_THUMBNAIL;
	}
}

// ensure every server is marked as a non-traffic server
for (const s of SERVERS) {
	s.trafficDensity = "None";
}

// ensure every server uses the default thumbnail for now (only if not already set)
for (const s of SERVERS) {
	if (!s.thumbnail) {
		s.thumbnail = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/Default.jpg";
	}
}