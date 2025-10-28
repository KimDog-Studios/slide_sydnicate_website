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

	// Vendor-aware defaults
	const lower = url.toLowerCase();
	let defaultImage = "";
	let vendorTag: string | undefined;
	if (lower.includes("gravygarage")) {
		defaultImage = GRAVYGARAGE_THUMB;
		vendorTag = "GravyGarage";
	} else if (/(^|\/)(wdts?|wdtstreet)/i.test(url)) {
		defaultImage = WDTS_THUMB;
		vendorTag = "WDTS";
	} else if (/(^|\/)vdc([_\-]|\/|$)/i.test(url) || lower.includes("vdc_")) {
		defaultImage = VDC_THUMB;
		vendorTag = "VDC";
	} else if (lower.includes("kimdog")) {
		// Hesi detection works for both "KimDog-Hesi-*.7z" and "kimdog_hesi_*"
		const isHesi = /(?:^|[\/_\-])hesi(?:[\/_\-]|$)/.test(lower) || lower.includes("kimdog_hesi");
		defaultImage = isHesi ? KIMDOG_HESI_THUMB : KIMDOG_THUMB;
		vendorTag = "KimDog";
	} else {
		// Fallback: infer vendor from filename prefix (e.g., adc_*)
		try {
			const path = decodeURIComponent(new URL(url).pathname).toLowerCase();
			const filename = path.split("/").filter(Boolean).pop() || "";
			if (filename.startsWith("adc_") || path.includes("/adc_")) {
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
	const baseTitle = opts?.title ?? autoTitle;
	const finalTitle = type === "map" ? baseTitle : ensureVendorPrefix(baseTitle, vendorTag);

	return {
		id: opts?.id ?? autoId,
		title: finalTitle,
		description: opts?.description ?? "",
		type,
		tags,
		version: opts?.version ?? "1.0",
		sizeMB: opts?.sizeMB, // optional
		updatedAt: defaultUpdatedAt,
		image: opts?.image ?? defaultImage,
		href: url,
		minTier: typeof opts?.minTier === "number" ? opts!.minTier : 0,
		maxTier: typeof opts?.maxTier === "number" ? opts!.maxTier : 3,
	};
}

export function buildFromLinks(
	links: string[],
	defaults?: Parameters<typeof createItemFromUrl>[1]
): DownloadItem[] {
	return links.map((u) => createItemFromUrl(u, defaults));
}

// Auto-generated lists (paste links; tags/tiers can be adjusted per group)
const kimdogLinks: string[] = [
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_drift_street_corvette.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_drift_street_gt3rs.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_drift_street_mustang_rtr.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_drift_street_r33.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_drift_street_s13.zip",
];

const gravyLinks: string[] = [
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_beater_jzx90.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_oaktree_street_200sx_alex.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_oaktree_street_s13_tye.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_oaktree_street_s14_vic.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_revive_street_s13_matt.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_180sx_corbett.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_180sx_meade.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_ae86_readie.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_e36_compact.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_e36_touring.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_e46.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_jzx100_mkii.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_jzx90.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_miata.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_s13_brent.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_s13_tim.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_s14_draper.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/gravygarage_street_s14_joel.zip",
];

// Maps
const mapLinks: string[] = [
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/adc_klutch_kickers_2024_winter.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/adc_klutch_kickers_drifters_paradise.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Brooklyn%20Park.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/brooklyn_park_remastered.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/CG-BASHLANDS-2024.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/CG-SEQUOIA-PARK.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/CG-SUNRISE-DRIFT-V2.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/ct_backwoods.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/driftplayground_2021.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/ebisu_complex.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/ebisu_minami.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/ebisu_nishi.rar",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/ebisu_north.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/ebisu_school_course.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Fort-51.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/fs_driftpark.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/grange_motor_circuit.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Kunitomi-Circuit.7z",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Minecraft-World.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Nexus_City.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/oi_wharf.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/owara_0.2.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/shibuya-hachiko-drift.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Steel-Yard.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/Total-Drift-Challenge.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Tracks/vdc_bikernieki_2022.zip"
];

const wdtsLinks: string[] = [ 
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_180sx.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_laurel_c33.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_silvia_s13.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_silvia_s14.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_silvia_s15.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_skyline_hr34.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_nissan_skyline_r32.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_toyota_ae86.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_toyota_cresta_jzx100.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_toyota_mark_ii_jzx90.zip",
    "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/wdts_toyota_soarer.zip",
];

// Packs
const packLinks: string[] = [
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Packs/GravyGarage-Pack.7z",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Packs/KimDog-Drift-Street-Pack.7z",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Packs/KimDog-Hesi-Pack.7z",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Packs/VDC-Car-Pack.7z",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Packs/WDTS-Car-Pack.7z",
];

// KimDog Hesi Cars
const kimdogHesiLinks: string[] = [
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_toyota_supra_mk4.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_porsche_911_gt3_rs_992.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_nissan_r35.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_nissan_r34.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_mitsubishi_evo_ix.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_mazda_rx7.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_lamorghini_gallardo_dde.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_lamborghini_trofoe_evo2.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_lamborghini_svj_63.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_honda_civic_eg6.zip",
	"https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Cars/kimdog_hesi_dodge_charger_hellcat.zip",
];

downloadsConfig.items.push(
	// KimDog cars (auto-tagged "kimdog" + thumbnail)
	...buildFromLinks(kimdogLinks, {
		type: "car",
		tags: ["drift"], // vendor tag auto-added
		minTier: 0,
		maxTier: 3,
	}),
	// GravyGarage cars (auto-tagged "gravygarage" + thumbnail)
	...buildFromLinks(gravyLinks, {
		type: "car",
		tags: ["drift"],
		minTier: 0,
		maxTier: 3,
	}),
	// Maps (auto-tag ADC and prefix title if applicable)
	...buildFromLinks(mapLinks, {
		type: "map",
		tags: ["track"],
		minTier: 0,
		maxTier: 3,
	}),
	// Packs (vendor tag/thumbnail auto-applied)
	...buildFromLinks(packLinks, {
		type: "pack",
		tags: ["pack"],
		minTier: 0,
		maxTier: 3,
	}),
	// KimDog Hesi cars (auto KimDog vendor tag; Hesi thumb auto applies)
	...buildFromLinks(kimdogHesiLinks, {
		type: "car",
		tags: ["KimDog-Hesi"],
		minTier: 0,
		maxTier: 3,
	}),
	// WDTS (when you add links, vendor tag/thumbnail will auto-apply)
	...buildFromLinks(wdtsLinks, { 
		type: "car", 
		tags: ["drift"], 
		minTier: 0, 
		maxTier: 3 
	}),
);
