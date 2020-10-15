const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
  purge: {
    content: ['./pages/**/*.js', './src/components/**/*.js'],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        themeText: 'var(--text)',
        themeText2: 'var(--text2)',
        themeBg: 'var(--bg)',
        themeBg2: 'var(--bg2)',
        themeAccent: 'var(--accent)',
        themeAccent2: 'var(--accent2)',
        themeSelect: 'var(--select)',
        themeSelect2: 'var(--select2)',
      },
      opacity: {
        90: '0.90',
      },
      maxHeight: {
        '80vh': '80vh',
      },
    },
  },
  variants: {},
  plugins: [
    plugin(function ({ addUtilities }) {
      const extendLineThrough = {
        '.line-through': {
          textDecoration: 'line-through',
          textDecorationColor: 'var(--accent)',
        },
      }

      addUtilities(extendLineThrough)
    }),
  ],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  experimental: {
    uniformColorPalette: true, // color shades are similar brightness
    extendedSpacingScale: true, // 72, 80, 96
    extendedFontSizeScale: true, // 7xl, 8xl, 9xl
  },
}
