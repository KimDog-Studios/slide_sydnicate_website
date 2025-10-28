"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

export type Step = { key: string; title: string; href: string; icon?: string };

export default function ProgressSteps({
	steps,
	completedKeys,
	allowedMaxIndex,
}: {
	steps: Step[];
	completedKeys?: Set<string>;
	allowedMaxIndex?: number;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const currentIdx = Math.max(0, steps.findIndex((s) => pathname?.startsWith(s.href)));
	return (
		<nav aria-label="Onboarding progress" style={{ margin: "10px auto 16px", maxWidth: 1100 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				{steps.map((s, i) => {
					const active = i === currentIdx;
					const done = completedKeys?.has(s.key) ?? false;
					const locked = typeof allowedMaxIndex === "number" ? i > allowedMaxIndex : false;
					return (
						<React.Fragment key={s.key}>
							<button
								type="button"
								onClick={() => {
									if (locked) return;
									router.push(s.href);
								}}
								title={s.title}
								aria-current={active ? "step" : undefined}
								disabled={locked}
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: 34,
									height: 34,
									borderRadius: 999,
									border: "1px solid rgba(255,255,255,0.12)",
									color: locked ? "rgba(255,255,255,0.5)" : "#fff",
									cursor: "pointer",
									background: done
										? "linear-gradient(90deg,#22c55e,#10b981)"
										: active
										? "linear-gradient(90deg,#6d28d9,#a78bfa)"
										: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
									boxShadow: active
										? "0 0 16px rgba(124,58,237,0.35)"
										: done
										? "0 0 12px rgba(16,185,129,0.25)"
										: "none",
									fontWeight: 900,
									opacity: locked && !active && !done ? 0.6 : 1,
								}}
							>
								{done ? "✓" : s.icon || i + 1}
							</button>
							<span style={{ color: "#e5e7eb", fontSize: 12, minWidth: 90, textAlign: "center" }}>{s.title}</span>
							{i < steps.length - 1 && (
								<span aria-hidden style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))", height: 4, borderRadius: 6, flex: 1 }} />
							)}
						</React.Fragment>
					);
				})}
			</div>
		</nav>
	);
}
