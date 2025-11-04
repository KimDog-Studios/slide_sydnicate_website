export type DownloadType = "car" | "map" | "tool" | "pack" | "livery";

export type DownloadItem = {
	id: string;
	title: string;
	description: string;
	type: DownloadType;
	tags: string[];
	version?: string;
	sizeMB?: number;
	updatedAt: string; // ISO
	image?: string;
	href: string;
	minTier?: number; // 0..3 (inclusive)
	maxTier?: number; // 0..3 (inclusive)
	// enriched metadata (optional)
	vendor?: string;          // detected vendor (e.g., "KimDog", "DWG", "WDTS", "VDC", "GravyGarage", "ADC")
	prettyTitle?: string;     // title without vendor noise/prefix
	sortKey?: string;         // normalized key for stable sorting if needed
	isNew?: boolean;          // computed from updatedAt (last 30 days)
	mirrors?: string[];       // optional alternative download URLs
	checksumSha256?: string;  // optional checksum for integrity
};

export const downloadsConfig: { items: DownloadItem[] } = {
	items: [
		// moved to auto-generated lists below
	],
};

// Helpers: build items from plain links so you can just paste URLs
const inferTypeFromUrl = (url: string): DownloadType => {
	const u = url.toLowerCase();
	if (u.includes("/cars/") || u.includes("car")) return "car";
	if (u.includes("/tracks/") || u.includes("/maps/") || u.includes("map")) return "map";
	if (u.includes("pack")) return "pack";
	if (u.includes("livery")) return "livery";
	return "tool";
};

const inferIdAndTitle = (url: string) => {
	try {
		const path = decodeURIComponent(new URL(url).pathname);
		const filename = path.split("/").filter(Boolean).pop() || "download";
		const base = filename.replace(/\.(zip|rar|7z|7zip|7-Zip|tar\.gz|tar|gz)$/i, "");
		const id = base.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\-]/g, "");
		const title = base
			.replace(/[_\-]+/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.replace(/\b\w/g, (m) => m.toUpperCase());
		return { id, title };
	} catch {
		return { id: `dl_${Math.random().toString(36).slice(2, 8)}`, title: "Download" };
	}
};

// Thumbnails for known collections
const GRAVYGARAGE_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/16771109507482.png";
const WDTS_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/wdtstreetpack11.jpg";
const KIMDOG_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Loading_Screens/163189863_1729626497216735_1524780481741060968_n.jpg";
const VDC_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/images.png";
const MAPS_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/work-in-progress.jpg";
const KIMDOG_HESI_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/KimDogHesi.jpg";
const DWG_THUMB = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/DWG-Logo.webp"

// Add convenient CDN base paths so lists can use filenames only
const CDN_BASE = "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/";
const CARS_BASE = `${CDN_BASE}Cars/`;
const TRACKS_BASE = `${CDN_BASE}Tracks/`;
const PACKS_BASE = `${CDN_BASE}Packs/`;

// Ensure titles start with the correctly cased vendor and fix casing if needed
function ensureVendorPrefix(title: string, vendor?: string): string {
	if (!vendor) return title;
	const t = (title || "").trim();
	if (!t) return vendor;
	const vl = vendor.toLowerCase();
	const tl = t.toLowerCase();
	if (tl.startsWith(vl)) {
		// fix casing of the prefix to match vendor exactly
		return vendor + t.slice(vendor.length);
	}
	return `${vendor} - ${t}`;
}

// Remove vendor noise from the start of auto-inferred titles
function cleanVendorNoise(title: string, vendor?: string): string {
	if (!title) return title;
	let t = title.trim();
	if (vendor === "DWG") {
		// drop leading "dthwsh", "dthwsh_", "dthwsh -", etc.
		t = t.replace(/^dthwsh[\s\-_]+/i, "");
	}
	if (vendor === "KimDog") {
		// optional: drop leading "kimdog" in filenames if present
		t = t.replace(/^kimdog[\s\-_]+/i, "");
	}
	return t.replace(/\s{2,}/g, " ").trim();
}

// Normalize text for sort keys (strip vendor, punctuation, and lower-case)
function normalizeForSort(s: string): string {
	return (s || "")
		.replace(/^(kimdog|dwg|wdts|vdc|gravygarage)\s*[-_]\s*/i, "")
		.replace(/[^a-z0-9]+/gi, " ")
		.trim()
		.toLowerCase();
}

export function createItemFromUrl(
	url: string,
	opts?: Partial<Omit<DownloadItem, "id" | "title" | "href" | "updatedAt" | "type" | "tags">> & {
		type?: DownloadType;
		tags?: string[];
		minTier?: number;
		maxTier?: number;
		title?: string;
		id?: string;
		updatedAt?: string;
	}
): DownloadItem {
	const { id: autoId, title: autoTitle } = inferIdAndTitle(url);
	const type = opts?.type ?? inferTypeFromUrl(url);
	// Stable default updatedAt to avoid SSR/CSR hydration mismatches
	const defaultUpdatedAt = opts?.updatedAt ?? "1970-01-01T00:00:00Z";

	// Vendor-aware defaults (based on filename/path, not CDN host)
	let defaultImage = "";
	let vendorTag: string | undefined;

	// Extract path + filename for reliable detection
	let pathname = "";
	let filename = "";
	try {
		const uo = new URL(url);
		pathname = decodeURIComponent(uo.pathname).toLowerCase();
		filename = pathname.split("/").filter(Boolean).pop() || "";
	} catch {
		pathname = url.toLowerCase();
		filename = pathnamesplitSafe(pathname);
	}
	function pathnamesplitSafe(p: string) {
		try { return p.split("/").filter(Boolean).pop() || ""; } catch { return ""; }
	}
	const inName = (re: RegExp) => re.test(filename) || re.test(pathname);

	// Order matters: detect DWG first, then others
	if (inName(/gravygarage/)) {
		defaultImage = GRAVYGARAGE_THUMB;
		vendorTag = "GravyGarage";
	} else if (inName(/(wdts|wdtstreet)/)) {
		defaultImage = WDTS_THUMB;
		vendorTag = "WDTS";
	} else if (inName(/(?:^|[\/_\-])vdc(?:[\/_\-]|$)/) || filename.includes("vdc_")) {
		defaultImage = VDC_THUMB;
		vendorTag = "VDC";
	} else if (inName(/(?:^|[\/_\-])(dwg|dthwsh)(?:[\/_\-]|$)/)) {
		// DWG/Deathwish vendor
		defaultImage = DWG_THUMB;
		vendorTag = "DWG";
	} else if (inName(/(?:^|[\/_\-])kimdog(?:[\/_\-]|$)/)) {
		// KimDog vendor (hesi-aware)
		const isHesi = inName(/(?:^|[\/_\-])hesi(?:[\/_\-]|$)/) || filename.includes("kimdog_hesi");
		defaultImage = isHesi ? KIMDOG_HESI_THUMB : KIMDOG_THUMB;
		vendorTag = "KimDog";
	} else {
		// Fallback: infer vendor from filename prefix (e.g., adc_)
		try {
			if (filename.startsWith("adc_") || pathname.includes("/adc_")) {
				vendorTag = "ADC";
			}
		} catch { /* ignore */ }
	}

	// Maps: do not prefix titles with vendor, and use a generic maps thumbnail
	if (type === "map") {
		// Keep VDC thumbnail if detected; otherwise use generic maps thumbnail
		if (!defaultImage || vendorTag === "KimDog") {
			defaultImage = MAPS_THUMB;
		}
	}

	// Merge tags + ensure vendor tag present (unique)
	const baseTags = (opts?.tags ?? ["download"]).slice();
	const tags = Array.from(new Set([...baseTags, ...(vendorTag ? [vendorTag] : [])]));

	// Compute final title with correct vendor prefix/casing
	const baseTitleRaw = opts?.title ?? autoTitle;
	const prettyTitle = cleanVendorNoise(baseTitleRaw, vendorTag);
	const title = (type === "map") ? prettyTitle : ensureVendorPrefix(prettyTitle, vendorTag);

	// Compute freshness flag from updatedAt (ignore default epoch)
	const isEpoch = (opts?.updatedAt ?? "1970-01-01T00:00:00Z") === "1970-01-01T00:00:00Z";
	let isNew = false;
	if (!isEpoch) {
		const ts = Date.parse(opts!.updatedAt!);
		if (!Number.isNaN(ts)) {
			const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
			isNew = days <= 30;
		}
	}

	return {
		id: opts?.id ?? autoId,
		title,
		description: opts?.description ?? "",
		type,
		tags,
		version: opts?.version ?? "1.0",
		sizeMB: opts?.sizeMB,
		updatedAt: opts?.updatedAt ?? "1970-01-01T00:00:00Z",
		image: opts?.image ?? defaultImage,
		href: url,
		minTier: typeof opts?.minTier === "number" ? opts!.minTier : 0,
		maxTier: typeof opts?.maxTier === "number" ? opts!.maxTier : 3,
		// enriched
		vendor: vendorTag,
		prettyTitle,
		sortKey: normalizeForSort(prettyTitle),
		isNew,
		mirrors: opts?.mirrors,
		checksumSha256: opts?.checksumSha256,
	};
}

// Keep original builder
export function buildFromLinks(
	links: string[],
	defaults?: Parameters<typeof createItemFromUrl>[1]
): DownloadItem[] {
	return links.map((u) => createItemFromUrl(u, defaults));
}

// New: accept either full URLs or just filenames, prefixing with a base when needed
const toUrl = (base: string, entry: string) =>
	entry.startsWith("http://") || entry.startsWith("https://")
		? entry
		: base + encodeURIComponent(entry);

// Extended list builder: supports string entries or inline overrides
type EntryOverride = {
	file: string;                 // filename or full URL
	title?: string;
	tags?: string[];
	minTier?: number;
	maxTier?: number;
	sizeMB?: number;
	image?: string;
	version?: string;
	updatedAt?: string;
	mirrors?: string[];
	checksumSha256?: string;
};

export function buildFromList(
	base: string,
	entries: Array<string | EntryOverride>,
	defaults?: Parameters<typeof createItemFromUrl>[1]
): DownloadItem[] {
	return entries.map((e) => {
		if (typeof e === "string") {
			return createItemFromUrl(toUrl(base, e), defaults);
		}
		const url = toUrl(base, e.file);
		return createItemFromUrl(url, {
			...defaults,
			title: e.title ?? defaults?.title,
			tags: e.tags ?? defaults?.tags,
			minTier: e.minTier ?? defaults?.minTier,
			maxTier: e.maxTier ?? defaults?.maxTier,
			sizeMB: e.sizeMB ?? defaults?.sizeMB,
			image: e.image ?? defaults?.image,
			version: e.version ?? defaults?.version,
			updatedAt: e.updatedAt ?? defaults?.updatedAt,
			mirrors: e.mirrors ?? defaults?.mirrors,
			checksumSha256: e.checksumSha256 ?? defaults?.checksumSha256,
		});
	});
}

// Quick stats and helpers the page can consume
export const VENDOR_COLORS: Record<string, string> = {
	KimDog: "#7c3aed",
	DWG: "#ef4444",
	WDTS: "#10b981",
	VDC: "#3b82f6",
	GravyGarage: "#f59e0b",
	ADC: "#06b6d4",
};

export function getDownloadStats(items: DownloadItem[] = downloadsConfig.items) {
	const total = items.length;
	const byType = items.reduce<Record<string, number>>((acc, i) => {
		acc[i.type] = (acc[i.type] ?? 0) + 1;
		return acc;
	}, {});
	const byVendor = items.reduce<Record<string, number>>((acc, i) => {
		const v = i.vendor ?? "Other";
		acc[v] = (acc[v] ?? 0) + 1;
		return acc;
	}, {});
	const tags = Array.from(new Set(items.flatMap((i) => i.tags))).sort((a, b) => a.localeCompare(b));
	const newCount = items.filter((i) => i.isNew).length;
	return { total, byType, byVendor, tags, newCount };
}

export function findDownloadById(id: string): DownloadItem | undefined {
	return downloadsConfig.items.find((i) => i.id === id);
}

// Auto-generated lists (paste links; tags/tiers can be adjusted per group)
const kimdogLinks: string[] = [
	"kimdog_drift_street_corvette.zip",
	"kimdog_drift_street_gt3rs.zip",
	"kimdog_drift_street_mustang_rtr.zip",
	"kimdog_drift_street_r33.zip",
	"kimdog_drift_street_s13.zip",
];

const gravyLinks: string[] = [
	"gravygarage_beater_jzx90.zip",
	"gravygarage_oaktree_street_200sx_alex.zip",
	"gravygarage_oaktree_street_s13_tye.zip",
	"gravygarage_oaktree_street_s14_vic.zip",
	"gravygarage_revive_street_s13_matt.zip",
	"gravygarage_street_180sx_corbett.zip",
	"gravygarage_street_180sx_meade.zip",
	"gravygarage_street_ae86_readie.zip",
	"gravygarage_street_e36_compact.zip",
	"gravygarage_street_e36_touring.zip",
	"gravygarage_street_e46.zip",
	"gravygarage_street_jzx100_mkii.zip",
	"gravygarage_street_jzx90.zip",
	"gravygarage_street_miata.zip",
	"gravygarage_street_s13_brent.zip",
	"gravygarage_street_s13_tim.zip",
	"gravygarage_street_s14_draper.zip",
	"gravygarage_street_s14_joel.zip",
];

// Maps
const mapLinks: string[] = [
	"adc_klutch_kickers_2024_winter.zip",
	"adc_klutch_kickers_drifters_paradise.zip",
	"Brooklyn Park.zip",
	"brooklyn_park_remastered.zip",
	"CG-BASHLANDS-2024.zip",
	"CG-SEQUOIA-PARK.zip",
	"CG-SUNRISE-DRIFT-V2.zip",
	"ct_backwoods.zip",
	"driftplayground_2021.zip",
	"ebisu_complex.zip",
	"ebisu_minami.zip",
	"ebisu_nishi.rar",
	"ebisu_north.zip",
	"ebisu_school_course.zip",
	"Fort-51.zip",
	"fs_driftpark.zip",
	"grange_motor_circuit.zip",
	"Kunitomi-Circuit.7z",
	"Minecraft-World.zip",
	"Nexus_City.zip",
	"oi_wharf.zip",
	"owara_0.2.zip",
	"shibuya-hachiko-drift.zip",
	"Steel-Yard.zip",
	"Total-Drift-Challenge.zip",
	"vdc_bikernieki_2022.zip",
];

const wdtsLinks: string[] = [
	"wdts_nissan_180sx.zip",
	"wdts_nissan_laurel_c33.zip",
	"wdts_nissan_silvia_s13.zip",
	"wdts_nissan_silvia_s14.zip",
	"wdts_nissan_silvia_s15.zip",
	"wdts_nissan_skyline_hr34.zip",
	"wdts_nissan_skyline_r32.zip",
	"wdts_toyota_ae86.zip",
	"wdts_toyota_cresta_jzx100.zip",
	"wdts_toyota_mark_ii_jzx90.zip",
	"wdts_toyota_soarer.zip",
];

// Packs
const packLinks: string[] = [
	"GravyGarage-Pack.7z",
	"KimDog-Drift-Street-Pack.7z",
	"KimDog-Hesi-Pack.7z",
	"VDC-Car-Pack.7z",
	"WDTS-Car-Pack.7z",
	"DWG-Car-Pack.7z",
];

// KimDog Hesi Cars
const kimdogHesiLinks: string[] = [
	"kimdog_hesi_toyota_supra_mk4.zip",
	"kimdog_hesi_porsche_911_gt3_rs_992.zip",
	"kimdog_hesi_nissan_r35.zip",
	"kimdog_hesi_nissan_r34.zip",
	"kimdog_hesi_mitsubishi_evo_ix.zip",
	"kimdog_hesi_mazda_rx7.zip",
	"kimdog_hesi_lamorghini_gallardo_dde.zip",
	"kimdog_hesi_lamborghini_trofoe_evo2.zip",
	"kimdog_hesi_lamborghini_svj_63.zip",
	"kimdog_hesi_honda_civic_eg6.zip",
	"kimdog_hesi_dodge_charger_hellcat.zip",
];

const devLinks: string[] = [
	"DEV-Street-Car-Pack.7z"
];

// DWG cars (Deathwish) — filenames only (easier to add)
const dwgFiles: string[] = [
	"dthwsh_nissan_180sx_gcorp.zip",
	"dthwsh_nissan_180sx_gpsports.zip",
	"dthwsh_nissan_240sx_c_kat.zip",
	"dthwsh_nissan_240sx_c_missile.zip",
	"dthwsh_nissan_240sx_c_w9.zip",
	"dthwsh_nissan_240sx_onevia_wonder.zip",
	"dthwsh_nissan_240sx_s13_5.zip",
	"dthwsh_nissan_240sx_s14_zenki.zip",
	"dthwsh_nissan_silvia_ps13.5_dmax.zip",
	"dthwsh_nissan_silvia_ps13_miyabi.zip",
	"dthwsh_nissan_silvia_s14_kouki_doof.zip",
	"dthwsh_nissan_silvia_s14_zenki_missile.zip",
	"dthwsh_nissan_silvia_s15_psduce.zip",
	"dthwsh_nissan_silvia_s15_vaero.zip",
	"dthwsh_mazda_rx7_fd_bn_lhd.zip",
	"dthwsh_mazda_rx7_fd3s_veilside.zip",
];

downloadsConfig.items.push(
	// KimDog cars — now accepts filenames or full URLs
	...buildFromList(CARS_BASE, kimdogLinks, {
		type: "car",
		tags: ["drift"], // vendor tag auto-added
		minTier: 0,
		maxTier: 3,
	}),
	// GravyGarage cars
	...buildFromList(CARS_BASE, gravyLinks, {
		type: "car",
		tags: ["drift"],
		minTier: 0,
		maxTier: 3,
	}),
	// Maps
	...buildFromList(TRACKS_BASE, mapLinks, {
		type: "map",
		tags: ["track"],
		minTier: 0,
		maxTier: 3,
	}),
	// Packs
	...buildFromList(PACKS_BASE, packLinks, {
		type: "pack",
		tags: ["pack"],
		minTier: 0,
		maxTier: 3,
	}),
	// KimDog Hesi cars
	...buildFromList(CARS_BASE, kimdogHesiLinks, {
		type: "car",
		tags: ["KimDog-Hesi"],
		minTier: 0,
		maxTier: 3,
	}),
	// WDTS
	...buildFromList(CARS_BASE, wdtsLinks, {
		type: "car",
		tags: ["drift"],
		minTier: 0,
		maxTier: 3,
	}),
	// DWG cars — filenames only, auto-tagged and thumb applied
	...buildFromList(CARS_BASE, dwgFiles, {
		type: "car",
		tags: ["DWG", "drift"],
		minTier: 0,
		maxTier: 3,
		image: DWG_THUMB,
	}),
	// Dev links
	...buildFromList(PACKS_BASE, devLinks, {
		type: "pack",
		tags: ["dev"],
		minTier: 3,
		maxTier: 3,
	}),
);
