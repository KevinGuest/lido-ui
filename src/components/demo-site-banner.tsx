"use client";

import { MarqueeTrack } from "@/components/dialog-marquees";

const BANNER_TEXT =
  "Umbrel demo · try.lido.wtf · Not a real mining pool · Do not connect miners here · Mock data only";

export function DemoSiteBanner() {
  return (
    <div
      className="bg-red-500 py-1.5 text-black dark:text-white"
      role="status"
      aria-label="This is the Umbrel demo on try.lido.wtf. Do not connect miners here."
      data-nosnippet
    >
      <MarqueeTrack text={BANNER_TEXT} />
    </div>
  );
}
