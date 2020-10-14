import { createContext, useContext, useEffect, useState } from 'react'

const themeContext = createContext({
  theme: '',
  toggleTheme: () => {},
})

const THEME_TYPES = {
  dark: 'theme-dark',
  light: 'theme-light',
  effective: 'theme-effective',
}

export function ThemeProvider(props) {
  // initial default is light theme
  const [theme, setTheme] = useState('dark')

  // initial theme
  useEffect(() => {
    // get locally stored theme
    let savedTheme = window.localStorage.getItem('theme')

    // if we don't have local stored then lets set it
    if (!savedTheme) {
      window.localStorage.setItem('theme', theme)
    }

    // if we have a local stored theme then let's set it
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  // when theme changes then assign to body tag
  useEffect(() => {
    Object.entries(THEME_TYPES).forEach(([, className]) =>
      globalThis.document.body.classList.remove(className)
    )
    globalThis.document.body.classList.add(THEME_TYPES[theme])
  }, [theme])

  const toggleTheme = () => {
    const themeList = Object.keys(THEME_TYPES)
    const themeIndex = themeList.findIndex(themeId => themeId === theme)
    const nextThemeIndex =
      themeIndex === themeList.length - 1 ? 0 : themeIndex + 1
    let newThemeId = themeList[nextThemeIndex]

    if (newThemeId === undefined) newThemeId = 'dark'
    setTheme(newThemeId)
    window.localStorage.setItem('theme', newThemeId)
  }

  const value = {
    theme,
    toggleTheme,
    THEME_TYPES,
  }

  return <themeContext.Provider value={value} {...props} />
}

export function useThemeContext() {
  return useContext(themeContext)
}
