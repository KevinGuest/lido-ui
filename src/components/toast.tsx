"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastTone = "default" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-400" strokeWidth={2} />;
  }
  if (tone === "error") {
    return <CircleAlert className="size-4 shrink-0 text-amber-400" strokeWidth={2} />;
  }
  return <Info className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />;
}

export function ToastProvider({
  children,
  /** Extra top offset (e.g. demo banner height). */
  offsetTopClassName = "top-4",
}: {
  children: ReactNode;
  offsetTopClassName?: string;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed right-4 z-[110] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2",
          offsetTopClassName,
        )}
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-xl backdrop-blur-md",
              "animate-in fade-in-0 slide-in-from-top-2 zoom-in-95 duration-200",
              item.tone === "success" &&
                "border-emerald-400/35 bg-emerald-950/85 text-emerald-50",
              item.tone === "error" &&
                "border-amber-400/35 bg-amber-950/85 text-amber-50",
              item.tone === "default" &&
                "border-border/70 bg-card/95 text-foreground",
            )}
          >
            <ToastIcon tone={item.tone} />
            <p className="min-w-0 flex-1 leading-snug font-medium">{item.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
