import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // strict mode monta componentes dos veces — causa doble trabajo en 3D
  headers: async () => [
    {
      source: "/(.*)",
      headers: [{ key: "Content-Type", value: "text/html; charset=utf-8" }],
    },
  ],
};

export default nextConfig;
