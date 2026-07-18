import Image from "next/image";

import { AppNav } from "@/components/app-nav";
import type { NetworkInfo } from "@/lib/mock-data";

export function AppHeader({
  title = "Lido",
  subtitle = "#2BGA",
  network,
  stratumConfigured = "",
}: {
  title?: string;
  subtitle?: string;
  network: NetworkInfo;
  stratumConfigured?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Image
          src="/logo.png"
          alt="Lido"
          width={48}
          height={48}
          className="mt-0.5 size-12 shrink-0 rounded-md [image-rendering:pixelated]"
          priority
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <AppNav stratumConfigured={stratumConfigured} network={network} />
    </header>
  );
}
