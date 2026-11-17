import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by infra/docker/Dockerfile.web (ignored by Vercel hosting)
  output: "standalone",
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/*.db",
          "**/*.db-shm",
          "**/*.db-wal",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
