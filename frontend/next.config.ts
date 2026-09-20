import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Evita que Turbopack tome el package-lock de la raíz del monorepo como workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      "pino-pretty",
      "lokijs",
      "encoding",
    ];
    return config;
  },
};

export default nextConfig;
