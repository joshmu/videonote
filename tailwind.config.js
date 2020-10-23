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
        themeBgOpacity: 'rgba(var(--bgNum), var(--bg-opacity))',
        themeAccent: 'var(--accent)',
        themeAccent2: 'var(--accent2)',
        themeSelect: 'var(--select)',
        themeSelectOpacity: 'rgba(var(--selectNum), var(--bg-opacity))',
      },
      opacity: {
        90: '0.90',
      },
      maxHeight: {
        '80vh': '80vh',
      },
      minHeight: {
        screenVh: 'calc(var(--vh) * 100)',
      },
      height: {
        screenVh: 'calc(var(--vh) * 100)',
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
    process.env.NODE_ENV !== 'production' &&
      require('tailwindcss-debug-screens'),
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
