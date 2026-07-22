import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PublicDeviceWorkersPage } from "@/components/public-device-workers-page";
import { deploymentKind } from "@/lib/app-meta";
import { deviceKeyFromRouteSlug } from "@/lib/device-label";
import { configuredStratumUrl, getDashboard } from "@/lib/pool";

type PageProps = {
  params: Promise<{ device: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { device } = await params;
  const key = deviceKeyFromRouteSlug(device);
  const title = key
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return {
    title: title || "Device",
    robots: { index: false, follow: true },
  };
}

export default async function DeviceWorkersRoute({ params }: PageProps) {
  const deployment = deploymentKind();
  if (deployment !== "public") {
    redirect("/");
  }

  const { device } = await params;
  const dashboard = await getDashboard();
  const stratumConfigured = configuredStratumUrl();

  return (
    <PublicDeviceWorkersPage
      initial={dashboard}
      deployment={deployment}
      stratumConfigured={stratumConfigured}
      deviceSlug={device}
    />
  );
}
