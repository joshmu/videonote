import { createContext, useContext, useState, useEffect } from 'react'

const themeContext = createContext({
  theme: '',
  toggleTheme: () => {},
})

export function ThemeProvider(props) {
  // initial default is light theme
  const [theme, setTheme] = useState('light')

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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
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
