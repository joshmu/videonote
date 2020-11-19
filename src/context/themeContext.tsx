import { createContext, useContext, useEffect, useState } from 'react'

import { useSetVh } from '@/hooks/useSetVh'

interface ThemeContextInterface {
  theme: string
  toggleTheme: () => void
  THEME_TYPES: { [key: string]: string }
}

const themeContext = createContext<ThemeContextInterface>(null!)

const LOCALSTORAGE_KEY: string = 'vn:theme'
const THEME_TYPES = {
  dark: 'theme-dark',
  light: 'theme-light',
  superhero: 'theme-superhero',
  hot: 'theme-hot',
}

export const ThemeProvider = (props: { [key: string]: string }) => {
  // define vh via --vh var to avoid viewport issues on mobile
  useSetVh()

  const [theme, setTheme] = useState<string>(Object.keys(THEME_TYPES)[0])

  // initial theme
  useEffect(() => {
    // get locally stored theme
    let savedTheme = window.localStorage.getItem(LOCALSTORAGE_KEY)

    // validation check
    if (!Object.keys(THEME_TYPES).includes(savedTheme)) savedTheme = null

    // if we have a saved theme then set it
    // otherwise update localStorage with default initial theme
    savedTheme
      ? setTheme(savedTheme)
      : window.localStorage.setItem(LOCALSTORAGE_KEY, theme)
  }, [])

  // when theme changes then assign to body tag
  useEffect(() => {
    Object.entries(THEME_TYPES).forEach(([, className]) =>
      globalThis.document.body.classList.remove(className)
    )
    globalThis.document.body.classList.add(THEME_TYPES[theme])
  }, [theme])

  const toggleTheme = () => {
    // get list of themeIds
    const themeIdList = Object.keys(THEME_TYPES)
    const themeIndex = themeIdList.findIndex(themeId => themeId === theme)
    // logic to continuously cycle through array
    const nextThemeIndex =
      themeIndex === themeIdList.length - 1 ? 0 : themeIndex + 1
    let newThemeId = themeIdList[nextThemeIndex]

    // validation check & fallback
    if (!themeIdList.includes(newThemeId)) newThemeId = themeIdList[0]

    setTheme(newThemeId)
    window.localStorage.setItem(LOCALSTORAGE_KEY, newThemeId)
  }

  const value: ThemeContextInterface = {
    theme,
    toggleTheme,
    THEME_TYPES,
  }

  return <themeContext.Provider value={value} {...props} />
}

export const useThemeContext = (): ThemeContextInterface => {
  return useContext(themeContext)
}
