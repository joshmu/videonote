module.exports = {
  purge: ['./pages/**/*.js', './src/components/**/*.js'],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [],
  future: {
    removeDeprecatedGapUtilities: true,
  },
  experimental: {
    uniformColorPalette: true, // color shades are similar brightness
    extendedSpacingScale: true, // 72, 80, 96
    extendedFontSizeScale: true, // 7xl, 8xl, 9xl
  },
}
