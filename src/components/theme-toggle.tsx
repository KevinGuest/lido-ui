"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "@/components/theme-init";

const STORAGE_KEY = THEME_STORAGE_KEY;

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "group relative flex size-10 items-center justify-center rounded-md border border-border",
        "bg-transparent text-foreground transition-colors hover:bg-muted/40",
        !ready && "invisible",
      )}
    >
      {dark ? (
        <Sun className="size-[1.15rem]" strokeWidth={1.75} />
      ) : (
        <Moon className="size-[1.15rem]" strokeWidth={1.75} />
      )}
      <span
        className={cn(
          "pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2",
          "rounded-md border border-border bg-background px-2 py-1 text-xs whitespace-nowrap text-foreground shadow-lg",
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        {dark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
