const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "direct2kariakoo.co.tz", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/**" },
    ],
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  trailingSlash: true,

  // ❌ output: "export"  ← REMOVED (THIS FIXES IPHONE)

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = withBundleAnalyzer(nextConfig);
