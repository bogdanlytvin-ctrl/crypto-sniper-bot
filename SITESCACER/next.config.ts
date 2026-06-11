import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // disabled for deployment stability
  /* config options here */
  reactStrictMode: true,
  allowedDevOrigins: ["*"],
};

export default nextConfig;
