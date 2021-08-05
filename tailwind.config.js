const colors = require("tailwindcss/colors");

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

/** @type{ import('tailwindcss/tailwind-config').TailwindConfig */
module.exports = {
  mode: "jit",
  purge: {
    content: ["src/{pages,components}/**/*.{ts,tsx}"],
    transform: transformers,
  },
  darkMode: "media",
  theme: {
    extend: {
      textColor: {
        caption: {
          light: colors.gray[600],
          dark: colors.gray[400],
        },
      },
    },
  },
};
