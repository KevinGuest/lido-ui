"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/** Keep visual px/s stable: ~60s for a short dialog line × 12 repeats. */
const MARQUEE_REF_CHARS = 280;
const MARQUEE_REF_DURATION_S = 60;

function marqueeLine(text: string) {
  const segment = `${text.trim().replace(/\s*·\s*$/, "")} · `;
  return Array.from({ length: 12 }, () => segment).join("");
}

function marqueeDurationSec(line: string) {
  return Math.max(
    20,
    (line.length / MARQUEE_REF_CHARS) * MARQUEE_REF_DURATION_S,
  );
}

export function MarqueeTrack({
  text,
  reverse,
}: {
  text: string;
  reverse?: boolean;
}) {
  const line = marqueeLine(text);
  const durationSec = marqueeDurationSec(line);

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

/**
 * Same look as MarqueeTrack, but while mounted (update dialog open) scroll
 * direction follows the pointer across the viewport:
 * left half → moves left, right half → moves right.
 */
function InteractiveMarqueeTrack({ text }: { text: string }) {
  const line = marqueeLine(text);
  const durationSec = marqueeDurationSec(line);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const dirRef = useRef<-1 | 1>(-1);
  const lastTsRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const onMove = (event: MouseEvent) => {
      dirRef.current = event.clientX < window.innerWidth / 2 ? -1 : 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const track = trackRef.current;
    if (!track) {
      return () => window.removeEventListener("mousemove", onMove);
    }

    let raf = 0;
    const tick = (now: number) => {
      const half = track.scrollWidth / 2;
      if (half > 0) {
        const dt = lastTsRef.current ? (now - lastTsRef.current) / 1000 : 0;
        lastTsRef.current = now;
        // Match CSS marquee: one full loop (−50%) over durationSec.
        const speed = half / durationSec;
        let next = offsetRef.current + dirRef.current * speed * dt;
        next = ((next % half) + half) % half;
        offsetRef.current = next === 0 ? 0 : next - half;
        track.style.transform = `translateX(${offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastTsRef.current = 0;
      window.removeEventListener("mousemove", onMove);
    };
  }, [durationSec, reducedMotion]);

  if (reducedMotion) {
    return (
      <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
        <div className="inline-flex w-max font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
          <span className="pr-6">{line}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
      <div
        ref={trackRef}
        className="inline-flex w-max will-change-transform font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
      >
        <span className="pr-6">{line}</span>
        <span className="pr-6">{line}</span>
      </div>
    </div>
  );
}

const TONE_BAND: Record<"connect" | "donate" | "update", string> = {
  connect: "bg-[#d97706] text-[#0a0a0a]",
  donate: "bg-red-500 text-black dark:text-white",
  update: "lido-marquee-update",
};

export function DialogMarquees({
  text,
  tone,
  children,
  showBottom = true,
}: {
  text: string;
  tone: "connect" | "donate" | "update";
  children: ReactNode;
  /** When false, only the top banner strip is shown. */
  showBottom?: boolean;
}) {
  const band = TONE_BAND[tone];
  const interactive = tone === "update";

  return (
    <>
      <div className={cn("py-1.5", band)}>
        {interactive ? (
          <InteractiveMarqueeTrack text={text} />
        ) : (
          <MarqueeTrack text={text} />
        )}
      </div>
      {children}
      {showBottom ? (
        <div className={cn("py-1.5", band)}>
          {interactive ? (
            <InteractiveMarqueeTrack text={text} />
          ) : (
            <MarqueeTrack text={text} reverse />
          )}
        </div>
      ) : null}
    </>
  );
}
