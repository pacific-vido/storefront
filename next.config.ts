import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The only raster is the local logo. Skipping the optimizer avoids sharp in the Railway image.
  images: { unoptimized: true },
  agentRules: false,
  // Demo data lives in the browser. Cache Components would treat the shell as a
  // cached server tree and fight the client-only session.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
