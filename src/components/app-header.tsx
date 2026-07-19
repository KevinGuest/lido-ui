import { AppNav } from "@/components/app-nav";
import { LogoThemeToggle } from "@/components/logo-theme-toggle";
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
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <LogoThemeToggle />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <AppNav stratumConfigured={stratumConfigured} network={network} />
    </header>
  );
}
