import path from "path";
import type { NextConfig } from "next";

/** Where uvicorn runs; used only by dev/prod server to proxy /api/* */
const BACKEND =
  process.env.BACKEND_PROXY_URL?.trim() || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "../"),
  /** Expose CRA-style name so REACT_APP_API_URL in .env.local is available in the browser bundle */
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
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
