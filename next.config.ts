import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // No turbopack in production
  },
  // Allow server actions if needed
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
