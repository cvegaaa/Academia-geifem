import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen de producción liviana (server.js autocontenido) — ver Dockerfile.
  output: "standalone",
};

export default nextConfig;
