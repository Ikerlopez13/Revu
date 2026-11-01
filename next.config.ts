import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return {
      // El sitio estático (landing, configurador, analytics) vive en /public.
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/configurador", destination: "/configurador/index.html" },
        { source: "/analytics/:slug", destination: "/analytics/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
