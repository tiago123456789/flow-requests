import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:async_hooks$/,
          path.resolve(__dirname, "async_hooks"),
        ),
      );
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      "node:async_hooks": {
        browser: "./async_hooks.js",
      },
    },
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
};

export default nextConfig;
