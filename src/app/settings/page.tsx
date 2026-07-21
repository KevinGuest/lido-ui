import type { Metadata } from "next";

import { SettingsPage } from "@/components/settings-page";
import type { PoolLifetimeStats } from "@/components/settings-info";
import { deploymentKind } from "@/lib/app-meta";
import { mockLifetimeUptimeSeconds, mockSessionUptimeSeconds } from "@/lib/mock-data";
import { configuredStratumUrl, getDashboard } from "@/lib/pool";

const isPublicSite =
  process.env.GITHUB_PAGES === "true" ||
  process.env.NEXT_PUBLIC_LIDO_DEMO === "true" ||
  process.env.LIDO_USE_MOCK === "true";

export const metadata: Metadata = isPublicSite
  ? {
      title: "Settings",
      description:
        "Configure Lido pool info, Stratum endpoints, Discord and Telegram alerts, and live logs.",
      robots: { index: false, follow: true },
    }
  : {
      title: "Settings",
    };

export default async function SettingsRoute() {
  const deployment = deploymentKind();
  const stratumConfigured = configuredStratumUrl();

  let network = null;
  let sv2AuthorityPublicKey: string | null = null;
  let lifetime: PoolLifetimeStats | null = null;
  try {
    const dashboard = await getDashboard();
    network = dashboard.network;
    sv2AuthorityPublicKey = dashboard.sv2AuthorityPublicKey ?? null;
    lifetime = {
      sharesAccepted: dashboard.sharesAccepted ?? 0,
      sharesRejected: dashboard.sharesRejected ?? 0,
      bestDifficulty: dashboard.pool.bestDifficulty ?? 0,
      blocksFound: dashboard.pool.blocksFound ?? 0,
      sessionUptimeSeconds:
        dashboard.uptimeSeconds ??
        (deployment === "demo" ? mockSessionUptimeSeconds() : null),
      overallUptimeSeconds:
        dashboard.overallUptimeSeconds ??
        (deployment === "demo" ? mockLifetimeUptimeSeconds() : null),
    };
  } catch {
    // Settings still render; client may hydrate network.
  }

  return (
    <SettingsPage
      deployment={deployment}
      stratumConfigured={stratumConfigured}
      initialNetwork={network}
      sv2AuthorityPublicKey={sv2AuthorityPublicKey}
      lifetime={lifetime}
    />
  );
}
