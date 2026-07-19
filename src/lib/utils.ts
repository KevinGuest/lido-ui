import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Works on http:// LAN hosts where navigator.clipboard is blocked. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to execCommand for insecure contexts (umbrel.local, LAN IP).
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.top = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, el.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/** Hover chips sit above the trigger; caret points down toward it.
 * No `relative` here — callers already use `absolute`, and twMerge would drop it.
 */
export const hoverLabelClassName =
  "rounded-md border border-transparent bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-lg before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[5px] before:border-transparent before:border-t-foreground before:content-['']"

/** Flip caret when the chip must sit below its trigger (e.g. under a clipping header). */
export const hoverLabelBelowClassName =
  "before:top-0 before:bottom-auto before:-translate-y-full before:border-t-transparent before:border-b-foreground"

/** Chip to the right of the trigger; caret points left toward it. */
export const hoverLabelRightClassName =
  "before:top-1/2 before:left-0 before:right-auto before:bottom-auto before:-translate-x-full before:-translate-y-1/2 before:border-t-transparent before:border-b-transparent before:border-r-foreground"
