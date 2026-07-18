"use client";

import { useLayoutEffect } from "react";

export const THEME_STORAGE_KEY = "lido-theme";

/** Apply saved theme before paint on the client (React 19-safe; no inline script). */
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
