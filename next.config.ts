import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    proxyPrefetch: "flexible",
  },
};

export default nextConfig;
