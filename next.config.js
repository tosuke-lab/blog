const withTM = require("next-transpile-modules")([
  "unified",
  "unist-util-map",
  "unist-util-visit",
  "remark-parse",
  "rehype-parse",
  "lowlight",
]);

/** @type {import('next/dist/next-server/server/config-shared')} */
const config = {
  images: {
    domains: require("./src/image-domains.json"),
  },
  webpack: (config, { dev, isServer }) => {
    if (dev || !isServer) return config;
    config.optimization.providedExports = false;
    return config;
  },
};

module.exports = withTM(config);
