import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
