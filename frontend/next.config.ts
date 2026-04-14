import path from "path";
import type { NextConfig } from "next";

/** Where uvicorn runs; used only by dev/prod server to proxy /api/* */
const BACKEND =
  process.env.BACKEND_PROXY_URL?.trim() || "https://lead-salal-management.onrender.com";

const nextConfig: NextConfig = {
  turbopack: {},
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "../"),

  /** Expose API URL to frontend */
  env: {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL ?? "",
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;