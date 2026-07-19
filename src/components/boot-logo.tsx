"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

/** Native asset size (public/logo*.png). */
const LOGO_PX = 1024;
/** Splash mark — compact beside the wordmark, smooth-scaled from the full PNG. */
const DISPLAY_PX = 128;

/**
 * Header-matched brand mark with a spinning logo during boot.
 * Full-res source, smooth downscale (no pixelated rendering).
 */
export function BootLogo({
  title = "Lido",
  subtitle = "#2BGA",
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)} aria-hidden="true">
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl motion-safe:animate-lido-boot-spin"
        style={{ width: DISPLAY_PX, height: DISPLAY_PX }}
      >
        <Image
          src="/logo.png"
          alt=""
          width={LOGO_PX}
          height={LOGO_PX}
          quality={100}
          priority
          sizes={`${DISPLAY_PX}px`}
          className="hidden size-full object-cover dark:block"
        />
        <Image
          src="/logo-light.png"
          alt=""
          width={LOGO_PX}
          height={LOGO_PX}
          quality={100}
          priority
          sizes={`${DISPLAY_PX}px`}
          className="block size-full object-cover dark:hidden"
        />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </p>
        <p className="mt-0.5 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      </div>
    </div>
  );
}
