import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  staticPageGenerationTimeout: 1200,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "**.firebasestorage.app" },
    ],
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // This is crucial for Vercel to not bundle these ESM-conflicting packages
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
