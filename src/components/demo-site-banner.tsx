"use client";

import { MarqueeTrack } from "@/components/dialog-marquees";

const BANNER_TEXT =
  "Demo site · Not a real mining pool · Do not connect miners here · Mock data only";

export function DemoSiteBanner() {
  return (
    <div
      className="bg-red-500 py-1.5 text-black dark:text-white"
      role="status"
      aria-label="This is a demo site. Do not connect miners here."
      data-nosnippet
    >
      <MarqueeTrack text={BANNER_TEXT} />
    </div>
  );
}
