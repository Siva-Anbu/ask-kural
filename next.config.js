/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent webpack from bundling @xenova/transformers — load it from node_modules at runtime
    serverComponentsExternalPackages: ['@xenova/transformers'],
  },
  webpack(config) {
    // Required for @xenova/transformers WASM backend
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

module.exports = nextConfig;
