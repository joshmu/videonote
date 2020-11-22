/**
 * @path /tailwind.config.js
 *
 * @project videonote
 * @file tailwind.config.js
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Sunday, 22nd November 2020 7:36:06 pm
 * @copyright © 2020 - 2020 MU
 */

const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

const plugins = [
  plugin(function ({ addUtilities }) {
    const extendLineThrough = {
      '.line-through': {
        textDecoration: 'line-through',
        textDecorationColor: 'var(--accent)',
      },
    }
    addUtilities(extendLineThrough)
  }),
]
const devOnlyPlugins = [require('tailwindcss-debug-screens')]

module.exports = {
  purge: [
    './pages/**/*.{ts,tsx, js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
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
        10: '0.10',
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
  plugins:
    process.env.NODE_ENV === 'production'
      ? plugins
      : [...plugins, ...devOnlyPlugins],
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
