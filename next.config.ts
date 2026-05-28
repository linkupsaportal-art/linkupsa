import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "gsap"],
    // Avatar uploads go straight from the browser to Supabase Storage now,
    // so server actions don't carry the binary. Keep this raised slightly
    // anyway for any future small file uploads.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    formats: ["image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
