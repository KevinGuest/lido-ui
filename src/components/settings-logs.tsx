"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ScrollText } from "lucide-react";

import {
  createDemoLogLine,
  downloadPoolLogs,
  fetchRecentPoolLogs,
  isDemoLogs,
  type PoolLogLine,
} from "@/lib/pool-logs";
import { cn, hoverLabelClassName } from "@/lib/utils";

const MAX_LINES = 500;

function levelClass(level: PoolLogLine["level"]): string {
  switch (level) {
    case "error":
      return "text-red-400";
    case "warn":
      return "text-amber-400";
    case "info":
      return "text-sky-400";
    default:
      return "text-muted-foreground";
  }
}

export function SettingsLogsPanel() {
  const [lines, setLines] = useState<PoolLogLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);
  const [filter, setFilter] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const demo = isDemoLogs();

  const filterTrimmed = filter.trim().toLowerCase();
  const visibleLines = filterTrimmed
    ? lines.filter((line) => {
        const haystack = `${line.level} ${line.message}`.toLowerCase();
        return haystack.includes(filterTrimmed);
      })
    : lines;

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    let demoTimer: number | undefined;

    void (async () => {
      try {
        const recent = await fetchRecentPoolLogs(200);
        if (cancelled) return;
        setLines(recent);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message || "Could not load logs");
      }

      if (demo) {
        demoTimer = window.setInterval(() => {
          setLines((current) => {
            const next = [...current, createDemoLogLine()];
            return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
          });
        }, 2200);
        return;
      }

      try {
        source = new EventSource("/api/logs/stream");
        source.onmessage = (event) => {
          try {
            const line = JSON.parse(event.data) as PoolLogLine;
            setLines((current) => {
              const next = [...current, line];
              return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
            });
          } catch {
            // ignore malformed
          }
        };
        source.onerror = () => {
          setError((prev) => prev ?? "Live stream disconnected — retrying…");
        };
      } catch (err) {
        setError((err as Error).message || "Could not open log stream");
      }
    })();

    return () => {
      cancelled = true;
      source?.close();
      if (demoTimer != null) window.clearInterval(demoTimer);
    };
  }, [demo]);

  useEffect(() => {
    if (!follow || filterTrimmed) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, follow, filterTrimmed]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Live logs</h2>
          <p className="text-sm text-muted-foreground">
            {demo
              ? "Live feed of sample pool activity"
              : "Streaming from the Lido pool process."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            aria-label="Filter logs"
            className={cn(
              "h-8 w-44 rounded-md border border-border/60 bg-transparent px-2.5 text-sm outline-none",
              "placeholder:text-muted-foreground/70 focus-visible:border-foreground/40",
            )}
          />
          <button
            type="button"
            role="switch"
            aria-checked={follow}
            aria-label="Follow"
            title="Follow"
            onClick={() => setFollow((value) => !value)}
            className={cn(
              "group relative flex size-8 items-center justify-center rounded-md border transition-colors",
              follow
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-transparent text-foreground hover:bg-muted/40",
            )}
          >
            <ScrollText className="size-4" strokeWidth={1.75} />
            <span
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
                hoverLabelClassName,
                "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              Follow
            </span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
          {error}
        </p>
      ) : null}

      <div
        ref={scrollerRef}
        className="h-80 overflow-y-auto overflow-x-hidden rounded-xl border border-border/50 bg-black/40 p-3 font-mono text-xs leading-relaxed sm:h-96"
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground">Waiting for log lines…</p>
        ) : visibleLines.length === 0 ? (
          <p className="text-muted-foreground">No lines match “{filter.trim()}”.</p>
        ) : (
          <ul className="space-y-1">
            {visibleLines.map((line) => (
              <li key={line.id} className="break-all">
                <span className="text-neutral-500">
                  {new Date(line.ts).toLocaleTimeString()}
                </span>{" "}
                <span className={cn("uppercase", levelClass(line.level))}>
                  {line.level}
                </span>{" "}
                <span className="text-neutral-200">{line.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => downloadPoolLogs(filterTrimmed ? visibleLines : lines)}
          disabled={visibleLines.length === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm",
            "transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <Download className="size-4" strokeWidth={1.75} />
          Download logs
        </button>
      </div>
    </div>
  );
}
