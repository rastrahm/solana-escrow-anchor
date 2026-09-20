import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Evita que Turbopack tome el package-lock de la raíz del monorepo como workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
