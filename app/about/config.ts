import { SERVERS } from "../servers/config";

export type TeamMember = {
	id: string;
	name: string;
	role: string;
	avatar: string;      // image url
	bio: string;
	gradient?: string;   // optional accent
	skills?: string[];
	social?: {
		youtube?: string;
		twitter?: string;
		instagram?: string;
		discord?: string;
	};
};

export type TimelineItem = {
	date: string;        // "2024", "Oct 2024", etc.
	title: string;
	description: string;
};

// derive stats from servers config
const SERVER_COUNT = SERVERS.length;
const MAP_COUNT = new Set(SERVERS.map((s) => s.map)).size;
const REGION_COUNT = new Set(SERVERS.map((s) => s.region)).size;

export const ABOUT = {
	tagline: "Built by Drifters, for Drifters.",
	mission:
		"We build high‑performance drift servers and community tools for Assetto Corsa — tuned for smooth tandem lines, street and track sessions, and stylish driving. Our focus is ultra‑low latency, predictable handling, stable lobbies, and helping drivers level up style and consistency.",
	values: [
		"Community First",
		"Performance Matters",
		"Creator-Friendly",
        "Regular Updates"
	],
	stats: {
		servers: SERVER_COUNT,
		maps: MAP_COUNT,
		regions: REGION_COUNT,
		playersMonthly: "N/A",
	},
};

export const TEAM: TeamMember[] = [
	{
		id: "kimdog",
		name: "KimDog",
		role: "Founder, Lead Dev",
		avatar: "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/KimDog.png",
		bio: "Runs infra, writes code, and keeps the wheels pointing the right way.",
		skills: ["Infra", "Gameplay"],
		social: { youtube: "https://www.youtube.com/@kimdog43" },
	},
	{
		id: "nikittv",
		name: "NikitTTV",
		role: "Co‑Owner, Creator",
		avatar: "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/channels4_profile.jpg",
		bio: "Content, events, and keeping vibes high during long tandem nights.",
		skills: ["Content", "Community", "Events"],
		social: { youtube: "https://www.youtube.com/@NikiTTV1" },
	},
];

export const TIMELINE: TimelineItem[] = [
	{
		date: "2025",
		title: "Started the Slide Syndicate Branding",
		description: "Before this change we used to be known as KimDog's Network.",
	},
    {
        date: "2024",
        title: "KimDog's Network Was Founded & Launched",
        description: "",
    }
];

// Fetch unique players seen in the last 30 days from the leaderboard API.
// Call from a client component (e.g., about/page.tsx) and show a fallback until it resolves.
export async function getMonthlyPlayers(signal?: AbortSignal): Promise<number | null> {
	try {
		const res = await fetch("/api/leaderboard?range=30d", { cache: "no-store", signal });
		if (!res.ok) return null;
		const data = (await res.json()) as Array<{ player?: string }>;
		const unique = new Set<string>();
		for (const row of data) {
			const name = (row.player || "").trim().toLowerCase();
			if (name) unique.add(name);
		}
		return unique.size;
	} catch {
		return null;
	}
}

// Basic formatter for displaying numbers consistently (e.g., 12,345)
export function formatNumber(n: number): string {
	try {
		return n.toLocaleString();
	} catch {
		return String(n);
	}
}
