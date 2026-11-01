import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Hay otro package-lock.json en el home: fijamos la raíz del proyecto.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
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
