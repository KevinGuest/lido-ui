/** Lightweight mainnet address check for login (not a full consensus validator). */
export function isLikelyBitcoinAddress(value: string): boolean {
  const address = value.trim();
  if (address.length < 26 || address.length > 90) return false;
  if (/^bc1[a-z0-9]{25,87}$/i.test(address)) return true;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
  return false;
}

export function shortenAddress(address: string, head = 8, tail = 6): string {
  const value = address.trim();
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
