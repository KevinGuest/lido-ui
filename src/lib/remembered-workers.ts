"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Worker } from "@/lib/mock-data";

const REMEMBERED_KEY = "lido-remembered-miners";
const REMOVED_KEY = "lido-removed-miners";

export type ListedWorker = Worker & { online: boolean };

export function workerPersistKey(worker: Pick<Worker, "name" | "address">): string {
  return `${worker.address || "_"}::${worker.name}`.toLowerCase();
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

function asOffline(worker: Worker): ListedWorker {
  return {
    ...worker,
    online: false,
    hashrate: 0,
    uptimeSeconds: null,
  };
}

function asOnline(worker: Worker): ListedWorker {
  return {
    ...worker,
    online: worker.online !== false,
  };
}

/** Merge live sessions with remembered miners; respect user removals. */
export function mergeListedWorkers(
  live: Worker[],
  remembered: Worker[],
  removedKeys: string[],
): ListedWorker[] {
  const removed = new Set(removedKeys);
  const liveKeys = new Set(live.map(workerPersistKey));
  const byKey = new Map<string, ListedWorker>();

  for (const worker of remembered) {
    const key = workerPersistKey(worker);
    if (removed.has(key) || liveKeys.has(key)) continue;
    byKey.set(key, asOffline(worker));
  }

  for (const worker of live) {
    const key = workerPersistKey(worker);
    if (removed.has(key)) continue;
    byKey.set(key, asOnline(worker));
  }

  return Array.from(byKey.values());
}

export function useRememberedWorkers(
  liveWorkers: Worker[],
  { persistRemovals = true }: { persistRemovals?: boolean } = {},
) {
  const [remembered, setRemembered] = useState<Worker[]>([]);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const prevLiveKeys = useRef<Set<string> | null>(null);

  useEffect(() => {
    setRemembered(persistRemovals ? readJson<Worker[]>(REMEMBERED_KEY, []) : []);
    setRemovedKeys(persistRemovals ? readJson<string[]>(REMOVED_KEY, []) : []);
    setReady(true);
  }, [persistRemovals]);

  useEffect(() => {
    if (!ready) return;

    const liveKeys = new Set(liveWorkers.map(workerPersistKey));

    // After the first snapshot: if a removed miner left the live set and comes
    // back, treat it as a reconnect and clear the removal.
    if (prevLiveKeys.current) {
      const previous = prevLiveKeys.current;
      setRemovedKeys((current) => {
        const next = current.filter((key) => {
          if (!liveKeys.has(key)) return true;
          const reconnected = !previous.has(key);
          return !reconnected;
        });
        if (persistRemovals && next.length !== current.length) {
          writeJson(REMOVED_KEY, next);
        }
        return next;
      });
    }
    prevLiveKeys.current = liveKeys;

    if (!persistRemovals) return;

    setRemembered((current) => {
      const byKey = new Map(
        current.map((worker) => [workerPersistKey(worker), worker] as const),
      );
      for (const worker of liveWorkers) {
        byKey.set(workerPersistKey(worker), worker);
      }
      const next = Array.from(byKey.values());
      writeJson(REMEMBERED_KEY, next);
      return next;
    });
  }, [liveWorkers, persistRemovals, ready]);

  const workers = useMemo(
    () => mergeListedWorkers(liveWorkers, remembered, removedKeys),
    [liveWorkers, remembered, removedKeys],
  );

  const onlineCount = useMemo(
    () => workers.filter((worker) => worker.online).length,
    [workers],
  );

  const removeWorker = useCallback(
    (worker: Worker) => {
      const key = workerPersistKey(worker);
      setRemovedKeys((current) => {
        if (current.includes(key)) return current;
        const next = [...current, key];
        if (persistRemovals) writeJson(REMOVED_KEY, next);
        return next;
      });
      setRemembered((current) => {
        const next = current.filter((item) => workerPersistKey(item) !== key);
        if (persistRemovals) writeJson(REMEMBERED_KEY, next);
        return next;
      });
    },
    [persistRemovals],
  );

  return { workers, onlineCount, removeWorker, ready };
}
