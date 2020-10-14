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
  const [theme, setTheme] = useState(Object.keys(THEME_TYPES)[0])

  // initial theme
  useEffect(() => {
    // get locally stored theme
    let savedTheme = window.localStorage.getItem('theme')

    // validation check
    if (!Object.keys(THEME_TYPES).includes(savedTheme)) savedTheme = null

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
