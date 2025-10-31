export type Partner = {
	id: string;
	name: string;
	website: string;            // https://... link to partner site
	logo: string;               // image URL (CDN or /public path)
	description: string;
	tags?: string[];            // choose from PARTNER_TAGS or add your own
	featured?: boolean;         // featured partners float to the top
	gradient?: string;          // custom CSS gradient for card accent
	promoCode?: string;         // optional promo code to display
	social?: {
		twitter?: string;
		instagram?: string;
		youtube?: string;
		discord?: string;
	};
};

// Suggested tags to keep things tidy (you can still use custom tags)
export const PARTNER_TAGS = [
	"Streaming",
	"Community"
] as const;

// Easy to add: just push another object here.
export const PARTNERS: Partner[] = [
	{
		id: "kimdog",
		name: "KimDog Studios",
		website: "",
		logo: "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/KimDog.png",
		description: "Main Partner and creator of this website.",
		tags: ["Servers", "Community"],
		featured: true,
		gradient: "linear-gradient(90deg,#7c3aed,#06b6d4)",
		social: { youtube: "https://www.youtube.com/@kimdog43" },
	},
	{
		id: "nikittv",
		name: "NikitTTV",
		website: "",
		logo: "https://kimdog-modding.b-cdn.net/Assetto%20Corsa%20-%20Cars/Website/channels4_profile.jpg",
		description: "Content Creator and Helps with Tuning the Cars.",
		tags: ["Streaming", "Community"],
		gradient: "linear-gradient(90deg,#a3e635 0%,#22c55e 35%,#16a34a 65%,#166534 100%)",
		social: { youtube: "https://www.youtube.com/@NikiTTV1" }
	}
];
