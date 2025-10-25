/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "direct2kariakoo.co.tz", pathname: "/**" },
      { protocol: "https", hostname: "najocreatives.co.tz", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/**" }
    ]
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  trailingSlash: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  }
};

module.exports = nextConfig;
