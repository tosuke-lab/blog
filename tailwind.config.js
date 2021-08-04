const transformers = ["ts", "tsx"].reduce((ext, pre) => {
  const transform = (content) => {
    try {
      return require("@babel/core").transformSync(content, {
        filename: `content.${ext}`,
      });
    } catch {
      return content;
    }
  };
  return {
    ...pre,
    [ext]: transform,
    [`.${ext}`]: transform,
  };
}, {});

module.exports = {
  mode: "jit",
  purge: {
    content: ["src/{pages,components}/**/*.{ts,tsx}"],
    transform: transformers,
  },
  darkMode: "media",
};
