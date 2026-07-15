"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function MarqueeTrack({
  text,
  reverse,
}: {
  text: string;
  reverse?: boolean;
}) {
  const segment = `${text} · `;
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
  tone: "connect" | "donate";
  children: ReactNode;
}) {
  const band =
    tone === "connect"
      ? "bg-[#1d59b3] text-white"
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
