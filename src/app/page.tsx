import { HomeDashboard } from "@/components/home-dashboard";
import { deploymentKind } from "@/lib/app-meta";
import { configuredStratumUrl, getDashboard } from "@/lib/pool";

// No route-segment `dynamic` export: GitHub Pages needs a static export, while
// live Umbrel builds call noStore() in getDashboard() so nothing is baked in.

export default async function HomePage() {
  const dashboard = await getDashboard();
  const deployment = deploymentKind();
  const stratumConfigured = configuredStratumUrl();

  return (
    <HomeDashboard
      initial={dashboard}
      deployment={deployment}
      stratumConfigured={stratumConfigured}
    />
  );
}
