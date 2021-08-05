const withTM = require("next-transpile-modules")([
  "unified",
  "unist-util-map",
  "unist-util-visit",
  "remark-parse",
  "rehype-parse",
  "lowlight",
]);

/** @type {import('next/dist/next-server/server/config-shared').NextConfig} */
const config = {
  images: {
    domains: require("./src/image-domains.json"),
  },
};

module.exports = withTM(config);
