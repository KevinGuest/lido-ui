import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isPages ? "export" : "standalone",
  ...(isPages
    ? {
        // Custom domain (lido.wtf) serves at `/`. Keep basePath empty.
        // Re-add `/lido-ui` only if publishing under username.github.io/lido-ui.
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
