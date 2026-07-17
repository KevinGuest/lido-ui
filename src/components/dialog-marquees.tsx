"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MarqueeTrack({
  text,
  reverse,
}: {
  text: string;
  reverse?: boolean;
}) {
  const segment = `${text.trim().replace(/\s*·\s*$/, "")} · `;
  const line = Array.from({ length: 12 }, () => segment).join("");

  return (
    <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
      <div
        className={cn(
          "inline-flex w-max font-mono text-[10px] font-bold uppercase tracking-[0.22em]",
          reverse ? "animate-lido-marquee-reverse" : "animate-lido-marquee",
        )}
      >
        <span className="pr-6">{line}</span>
        <span className="pr-6">{line}</span>
      </div>
    </div>
  );
}

export function DialogMarquees({
  text,
  tone,
  children,
}: {
  text: string;
  tone: "connect" | "donate" | "update";
  children: ReactNode;
}) {
  const band =
    tone === "connect"
      ? "bg-[#1d59b3] text-white"
      : tone === "update"
        ? "bg-[#57F287] text-[#111111]"
        : "bg-red-500 text-white";
      
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
