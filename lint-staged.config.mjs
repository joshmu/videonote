export default {
  "*.{ts,tsx,js,mjs}": ["oxfmt --write", "oxlint --fix"],
  "*.{json,css}": ["oxfmt --write"],
  "*.md": ["markdownlint-cli2"],
};
