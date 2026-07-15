import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isPages ? "export" : "standalone",
  ...(isPages
    ? {
        basePath: "/lido-ui",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
