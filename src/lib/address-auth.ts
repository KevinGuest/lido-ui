import { isLikelyBitcoinAddress } from "@/lib/bitcoin-address";
import type { Worker } from "@/lib/mock-data";

/** True when the pool currently lists at least one worker for this address. */
export function addressHasPoolWorkers(
  address: string,
  workers: Pick<Worker, "address">[],
): boolean {
  const needle = address.trim().toLowerCase();
  if (!needle || !isLikelyBitcoinAddress(needle)) return false;
  return workers.some(
    (worker) => worker.address.trim().toLowerCase() === needle,
  );
}
