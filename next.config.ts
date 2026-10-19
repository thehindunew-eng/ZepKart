import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandbox preview host to load dev assets and HMR.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "storage.googleapis.com" }] },
};

export default nextConfig;
