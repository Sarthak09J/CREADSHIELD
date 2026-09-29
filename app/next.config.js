/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Midnight.js uses some Node APIs; configure webpack for browser compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
