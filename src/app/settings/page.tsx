import { SettingsPage } from "@/components/settings-page";
import type { PoolLifetimeStats } from "@/components/settings-info";
import { deploymentKind } from "@/lib/app-meta";
import { configuredStratumUrl, getDashboard } from "@/lib/pool";

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
      platform: dashboard.platform ?? (deployment === "demo" ? "Linux" : null),
      sharesAccepted: dashboard.sharesAccepted ?? 0,
      sharesRejected: dashboard.sharesRejected ?? 0,
      bestDifficulty: dashboard.pool.bestDifficulty ?? 0,
      blocksFound: dashboard.pool.blocksFound ?? 0,
      overallUptimeSeconds:
        dashboard.overallUptimeSeconds ??
        (deployment === "demo" ? 86_400 * 57 : null),
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
