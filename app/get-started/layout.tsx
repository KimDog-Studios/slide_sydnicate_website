"use client";
import React from "react";
import ProgressSteps, { Step } from "../../Components/ProgressSteps";
import { usePathname, useRouter } from "next/navigation";

const steps: Step[] = [
	{ key: "install", title: "Install", href: "/get-started" },
	{ key: "tools", title: "Tools", href: "/get-started/tools" },
	{ key: "discord", title: "Discord", href: "/get-started/discord" },
	{ key: "membership", title: "Membership", href: "/get-started/membership" },
	{ key: "servers", title: "Servers", href: "/get-started/servers" },
];

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const [completed, setCompleted] = React.useState<Record<string, boolean>>({
		install: false,
		tools: false,
		discord: false,
		membership: false,
		servers: false,
	});

	// Refresh completion from localStorage + API (auto-complete Discord/Membership when possible)
	const refreshCompletion = React.useCallback(async () => {
		const local = (k: string) => (typeof window !== "undefined" ? window.localStorage.getItem(k) === "1" : false);
		const base: Record<string, boolean> = {
			install: local("gs:install"),
			tools: local("gs:tools"),
			discord: local("gs:discord"),
			membership: local("gs:membership"),
			servers: local("gs:servers"),
		};
		// Discord login state
		try {
			const s = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
			const sj = s.ok ? await s.json() : null;
			if (sj?.authenticated) base.discord = true;
		} catch {}
		// Membership ownership
		try {
			const r = await fetch("/api/auth/subscription-status", { credentials: "include", cache: "no-store" });
			const j = r.ok ? await r.json() : null;
			if (Array.isArray(j?.levels) && j.levels.length > 0) base.membership = true;
		} catch {}
		setCompleted((prev) => ({ ...prev, ...base }));
	}, []);

	React.useEffect(() => {
		refreshCompletion();
		const onStorage = (e: StorageEvent) => {
			if (!e.key || !e.key.startsWith("gs:")) return;
			refreshCompletion();
		};
		if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
		return () => { if (typeof window !== "undefined") window.removeEventListener("storage", onStorage); };
	}, [refreshCompletion]);

	// Highest continuously completed index
	const highestCompletedIndex = React.useMemo(() => {
		let idx = -1;
		for (let i = 0; i < steps.length; i++) {
			const k = steps[i].key as keyof typeof completed;
			if (!completed[k]) break;
			idx = i;
		}
		return idx;
	}, [completed]);

	// Guard forward navigation
	React.useEffect(() => {
		const currIdx = steps.findIndex((s) => pathname?.startsWith(s.href));
		const maxAllowed = Math.min(highestCompletedIndex + 1, steps.length - 1);
		if (currIdx === -1) return;
		if (currIdx > maxAllowed) {
			router.replace(steps[maxAllowed].href);
		}
	}, [pathname, highestCompletedIndex, router]);

	const onFinish = () => {
		try { localStorage.setItem("gs:servers", "1"); localStorage.setItem("gs:finished", "1"); } catch {}
		router.push("/profile");
	};

	return (
		<main style={{ minHeight: "100vh", color: "#fff", background: "#0b0b0b" }}>
			<section style={{ padding: "140px 16px 24px", maxWidth: 1120, margin: "0 auto" }}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
					<h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 900, textShadow: "0 0 16px rgba(124,58,237,0.6)" }}>
						Get Started
					</h1>
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							padding: "6px 10px",
							borderRadius: 999,
							background: "linear-gradient(90deg,#6d28d9,#a78bfa)",
							boxShadow: "0 10px 26px rgba(124,58,237,0.30), 0 0 18px rgba(124,58,237,0.45)",
							border: "1px solid rgba(255,255,255,0.08)",
							fontWeight: 900,
						}}
						aria-label="Average setup time"
					>
						<span role="img" aria-hidden>⏱️</span> Avg. 15 minutes
					</span>
				</div>
				{/* Progress bar (lights: previous = done, current = active) */}
				<ProgressSteps steps={steps} />
				{/* Step content */}
 				{children}
				{/* Finished button on last step when prerequisites are done */}
				{pathname?.startsWith("/get-started/servers") && completed.install && completed.tools && completed.discord && completed.membership && (
					<div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
						<button
							type="button"
							onClick={onFinish}
							style={{
								padding: "10px 14px",
								borderRadius: 10,
								fontWeight: 900,
								color: "#0b0b0b",
								background: "#fff",
								border: "1px solid rgba(255,255,255,0.14)",
								cursor: "pointer",
							}}
						>
							Finished ✓
						</button>
					</div>
				)}
			</section>
		</main>
	);
}
