"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_WIPE_MS = 520;
const LOGO_SPIN_MS = 720;
/** Swap faces while the spin is already fast. */
const LOGO_SWAP_AT_MS = 520;

function setDocumentTheme(nextDark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", nextDark);
  root.style.colorScheme = nextDark ? "dark" : "light";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
  } catch {
    // Ignore storage errors.
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runThemeWipe(nextDark: boolean) {
  const reduced = prefersReducedMotion();
  const startViewTransition = document.startViewTransition?.bind(document);

  if (!reduced && typeof startViewTransition === "function") {
    const transition = startViewTransition(() => {
      setDocumentTheme(nextDark);
    });
    await transition.finished;
    return;
  }

  setDocumentTheme(nextDark);
  if (!reduced) {
    await wait(THEME_WIPE_MS);
  }
}

/** Header logo doubles as the theme control. Default theme is dark. */
export function LogoThemeToggle({ className }: { className?: string }) {
  const [themeDark, setThemeDark] = useState(true);
  const [logoDark, setLogoDark] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeDark(isDark);
    setLogoDark(isDark);
    setReady(true);
  }, []);

  async function toggle() {
    if (busy) return;
    const next = !themeDark;
    setBusy(true);
    try {
      await runThemeWipe(next);
      setThemeDark(next);

      if (prefersReducedMotion()) {
        setLogoDark(next);
        return;
      }

      setSpinning(true);
      await wait(LOGO_SWAP_AT_MS);
      setLogoDark(next);
      await wait(LOGO_SPIN_MS - LOGO_SWAP_AT_MS);
      setSpinning(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={themeDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-busy={busy}
      disabled={busy}
      onClick={() => {
        void toggle();
      }}
      className={cn(
        "lido-logo-theme-toggle relative shrink-0 rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:cursor-wait",
        !ready && "invisible",
        className,
      )}
      style={{ perspective: "900px" }}
    >
      <span
        className={cn(
          "relative block size-12 overflow-hidden rounded-md [transform-style:preserve-3d]",
          spinning && "lido-logo-spin-accelerate",
        )}
      >
        <Image
          src={logoDark ? "/logo.png" : "/logo-light.png"}
          alt=""
          width={1024}
          height={1024}
          quality={100}
          sizes="48px"
          aria-hidden="true"
          className="size-12 object-cover"
          priority
        />
      </span>
    </button>
  );
}
