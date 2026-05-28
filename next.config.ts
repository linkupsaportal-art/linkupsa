import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "gsap"],
  },
  images: {
    formats: ["image/webp"],
  },
};

export default nextConfig;
