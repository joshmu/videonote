/**
 * @path /src/context/themeContext.tsx
 *
 * @project videonote
 * @file themeContext.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Tuesday, 1st December 2020 3:20:48 pm
 * @copyright © 2020 - 2020 MU
 */

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

// import { useSetVh } from '@/hooks/useSetVh'

interface ThemeContextInterface {
  theme: string
  toggleTheme: () => void
}

const themeContext = createContext<ThemeContextInterface>(null!)

const LOCALSTORAGE_KEY: string = 'vn:theme'

export enum ThemeType {
  DARK = 'theme-dark',
  LIGHT = 'theme-light',
  SUPERHERO = 'theme-superhero',
  HOT = 'theme-hot',
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // define vh via --vh var to avoid viewport issues on mobile
  // useSetVh()

  // initialize theme with first enum entry
  const [theme, setTheme] = useState<ThemeType>(
    Object.values(ThemeType)[0] as ThemeType
  )

  // initial theme
  useEffect(() => {
    // get locally stored theme
    let savedTheme = window.localStorage.getItem(LOCALSTORAGE_KEY) as ThemeType

    // validation check
    if (!Object.values(ThemeType).includes(savedTheme)) savedTheme = null

    // if we have a saved theme then set it
    // otherwise update localStorage with default initial theme
    savedTheme
      ? setTheme(savedTheme)
      : window.localStorage.setItem(LOCALSTORAGE_KEY, theme)
  }, [])

  // when theme changes then assign to body tag
  useEffect(() => {
    Object.values(ThemeType).forEach(className =>
      globalThis.document.body.classList.remove(className)
    )
    globalThis.document.body.classList.add(theme)
  }, [theme])

  const toggleTheme = () => {
    // get list of themeIds
    const themeList = Object.values(ThemeType)
    const themeIndex = themeList.findIndex(classname => classname === theme)
    // logic to continuously cycle through array
    const nextThemeIndex =
      themeIndex === themeList.length - 1 ? 0 : themeIndex + 1
    let newTheme = themeList[nextThemeIndex]

    // validation check & fallback
    if (!themeList.includes(newTheme)) newTheme = themeList[0]

    setTheme(newTheme)
    window.localStorage.setItem(LOCALSTORAGE_KEY, newTheme)
  }

  const value: ThemeContextInterface = {
    theme,
    toggleTheme,
  }

  return <themeContext.Provider value={value}>{children}</themeContext.Provider>
}

export const useThemeContext = (): ThemeContextInterface => {
  return useContext(themeContext)
}
