const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "../"),

  /** Expose API URL to frontend */
  env: {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL ?? "",
  },

  async rewrites() {
    const BACKEND =
      process.env.BACKEND_PROXY_URL?.trim() || "https://lead-salal-management.onrender.com";
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;