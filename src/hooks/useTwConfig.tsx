/**
 * Provides resolved tailwind theme values at runtime.
 * tailwindcss v4 removed resolveConfig, so custom theme colors
 * are inlined here to match tailwind.config.js definitions.
 */
const twConfig = {
  theme: {
    colors: {
      themeText: "var(--text)",
      themeText2: "var(--text2)",
      themeBg: "var(--bg)",
      themeBg2: "var(--bg2)",
      themeAccent: "var(--accent)",
      themeAccent2: "var(--accent2)",
      themeSelect: "var(--select)",
      themeSelectOpacity: "rgba(var(--selectNum), 0.25)",
    },
  },
};

const useTwConfig = () => twConfig;

export default useTwConfig;
