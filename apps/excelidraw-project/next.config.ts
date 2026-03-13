import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo root (where pnpm-lock.yaml lives) so Turbopack uses the correct workspace
    root: path.join(process.cwd(), "..", ".."),
  },
};

export default nextConfig;
