import type { NextConfig } from "next";

import packageJson from "./package.json";

const isPages = process.env.GITHUB_PAGES === "true";
const isDemo = isPages || process.env.LIDO_USE_MOCK === "true";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LIDO_VERSION: packageJson.version,
    ...(isDemo ? { NEXT_PUBLIC_LIDO_DEMO: "true" } : {}),
  },
  output: isPages ? "export" : "standalone",
  images: {
    // Logos use quality={100}; Next 16 defaults to [75] only.
    qualities: [75, 100],
    ...(isPages ? { unoptimized: true } : {}),
  },
  ...(isPages
    ? {
        // Custom domain (lido.wtf) serves at `/`. Keep basePath empty.
        // Re-add `/lido-ui` only if publishing under username.github.io/lido-ui.
        trailingSlash: true,
      }
    : {}),
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
