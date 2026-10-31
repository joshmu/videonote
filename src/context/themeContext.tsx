/**
 * @path /src/context/themeContext.tsx
 *
 * @project videonote
 * @file themeContext.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Sunday, 23rd January 2022 6:30:30 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface ThemeContextInterface {
  theme: string;
  toggleTheme: () => void;
}

const themeContext = createContext<ThemeContextInterface>(null!);

const LOCALSTORAGE_KEY: string = "vn:theme";

export enum ThemeType {
  DARK = "theme-dark",
  SUPERHERO = "theme-superhero",
  LIGHT = "theme-light",
}

const DEFAULT_THEME = ThemeType.DARK;

// matches --bg in globals.css, for the phone browser's toolbar
export const THEME_BACKGROUND: Record<ThemeType, string> = {
  [ThemeType.DARK]: "#202020",
  [ThemeType.SUPERHERO]: "#46344e",
  [ThemeType.LIGHT]: "#f9fafb",
};

// Runs before first paint, so a saved theme never flashes the default.
export const applySavedThemeScript = `try{var t=localStorage.getItem(${JSON.stringify(LOCALSTORAGE_KEY)});if(${JSON.stringify(Object.values(ThemeType))}.indexOf(t)>-1)document.body.className=t}catch(e){}`;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // starts on the default so the first render matches the server's
  const [theme, setTheme] = useState<ThemeType>(DEFAULT_THEME);

  useEffect(() => {
    // the script in _document has already put the saved theme on the body
    const current =
      Object.values(ThemeType).find((name) => document.body.classList.contains(name)) ??
      DEFAULT_THEME;
    setTheme(current);
    if (!window.localStorage.getItem(LOCALSTORAGE_KEY)) {
      window.localStorage.setItem(LOCALSTORAGE_KEY, current);
    }
  }, []);

  const toggleTheme = () => {
    // get list of themeIds
    const themeList = Object.values(ThemeType);
    const themeIndex = themeList.findIndex((classname) => classname === theme);
    // logic to continuously cycle through array
    const nextThemeIndex = themeIndex === themeList.length - 1 ? 0 : themeIndex + 1;
    let newTheme = themeList[nextThemeIndex];

    // validation check & fallback
    if (!themeList.includes(newTheme)) newTheme = themeList[0];

    themeList.forEach((className) => document.body.classList.remove(className));
    document.body.classList.add(newTheme);
    setTheme(newTheme);
    window.localStorage.setItem(LOCALSTORAGE_KEY, newTheme);
  };

  const value: ThemeContextInterface = {
    theme,
    toggleTheme,
  };

  return <themeContext.Provider value={value}>{children}</themeContext.Provider>;
};

export const useThemeContext = (): ThemeContextInterface => {
  return useContext(themeContext);
};
