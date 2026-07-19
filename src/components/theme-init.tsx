"use client";

import { useLayoutEffect } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";

export { THEME_STORAGE_KEY };

/** Keep theme in sync after hydration (boot script already applied pre-paint). */
export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const dark = stored ? stored === "dark" : true;
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    } catch {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  }, []);

  return null;
}
