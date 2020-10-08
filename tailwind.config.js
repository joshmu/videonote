const { colors } = require('tailwindcss/defaultTheme')
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
        themeHighlight: `rgba(var(--highlight), var(--bg-opacity))`,
        themeLight: 'var(--light)',
        themeDark: 'var(--dark)',
        highlight: {
          100: '#ffe8db',
          200: '#ffd0b7',
          300: '#ffb994',
          400: '#ffa170',
          500: '#ff8a4c',
          600: '#cc6e3d',
          700: '#99532e',
          800: '#66371e',
          900: '#331c0f',
        },
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
    plugin(function ({ addUtilities, theme }) {
      const extendLineThrough = {
        '.line-through': {
          textDecoration: 'line-through',
          textDecorationColor: theme('colors.highlight.400'),
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
