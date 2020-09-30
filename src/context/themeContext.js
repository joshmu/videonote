import { createContext, useContext, useState, useEffect } from 'react'

const themeContext = createContext({
  theme: '',
  toggleTheme: () => {},
})

const TYPES = {
  dark: 'theme-dark',
  light: 'theme-light',
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
    Object.entries(TYPES).forEach(([, className]) =>
      globalThis.document.body.classList.remove(className)
    )
    globalThis.document.body.classList.add(TYPES[theme])
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    window.localStorage.setItem('theme', newTheme)
  }

  const value = {
    theme,
    toggleTheme,
  }

  return <themeContext.Provider value={value} {...props} />
}

export function useThemeContext() {
  return useContext(themeContext)
}
