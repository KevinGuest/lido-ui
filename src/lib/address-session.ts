"use client";

import { useCallback, useEffect, useState } from "react";

import { isLikelyBitcoinAddress } from "@/lib/bitcoin-address";

const STORAGE_KEY = "lido-public-address";

export function readStoredAddress(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    return isLikelyBitcoinAddress(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredAddress(address: string | null) {
  try {
    if (!address) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, address.trim());
  } catch {
    // Ignore quota / private mode.
  }
}

export function useAddressSession() {
  const [address, setAddressState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAddressState(readStoredAddress());
    setReady(true);
  }, []);

  const login = useCallback((next: string) => {
    const trimmed = next.trim();
    if (!isLikelyBitcoinAddress(trimmed)) {
      throw new Error("Enter a valid Bitcoin address");
    }
    writeStoredAddress(trimmed);
    setAddressState(trimmed);
  }, []);

  const logout = useCallback(() => {
    writeStoredAddress(null);
    setAddressState(null);
  }, []);

  return { address, ready, login, logout };
}
