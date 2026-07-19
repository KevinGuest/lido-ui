"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Keep visual px/s stable: ~60s for a short dialog line × 12 repeats. */
const MARQUEE_REF_CHARS = 280;
const MARQUEE_REF_DURATION_S = 60;

export function MarqueeTrack({
  text,
  reverse,
}: {
  text: string;
  reverse?: boolean;
}) {
  const segment = `${text.trim().replace(/\s*·\s*$/, "")} · `;
  const line = Array.from({ length: 12 }, () => segment).join("");
  const durationSec = Math.max(
    20,
    (line.length / MARQUEE_REF_CHARS) * MARQUEE_REF_DURATION_S,
  );

  return (
    <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
      <div
        className={cn(
          "inline-flex w-max font-mono text-[10px] font-bold uppercase tracking-[0.22em]",
          reverse ? "animate-lido-marquee-reverse" : "animate-lido-marquee",
        )}
        style={{ animationDuration: `${durationSec}s` }}
      >
        <span className="pr-6">{line}</span>
        <span className="pr-6">{line}</span>
      </div>
    </div>
  );
}

const TONE_BAND: Record<"connect" | "donate" | "update", string> = {
  connect: "bg-[#1d59b3] text-black dark:text-white",
  donate: "bg-red-500 text-black dark:text-white",
  update: "bg-[#57F287] text-black dark:text-white",
};

export function DialogMarquees({
  text,
  tone,
  children,
}: {
  text: string;
  tone: "connect" | "donate" | "update";
  children: ReactNode;
}) {
  const band = TONE_BAND[tone];

  return (
    <>
      <div className={cn("py-1.5", band)}>
        <MarqueeTrack text={text} />
      </div>
      {children}
      <div className={cn("py-1.5", band)}>
        <MarqueeTrack text={text} reverse />
      </div>
    </>
  );
}
