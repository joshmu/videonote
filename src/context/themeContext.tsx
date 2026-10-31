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

// Runs before first paint, so a saved theme never flashes the default.
export const applySavedThemeScript = `try{var t=localStorage.getItem(${JSON.stringify(LOCALSTORAGE_KEY)});if(${JSON.stringify(Object.values(ThemeType))}.indexOf(t)>-1)document.body.className=t}catch(e){}`;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // the script in _document has already put the saved theme on the body
  const [theme, setTheme] = useState<ThemeType>(() =>
    typeof document === "undefined"
      ? DEFAULT_THEME
      : (Object.values(ThemeType).find((name) => document.body.classList.contains(name)) ??
        DEFAULT_THEME),
  );

  useEffect(() => {
    if (!window.localStorage.getItem(LOCALSTORAGE_KEY)) {
      window.localStorage.setItem(LOCALSTORAGE_KEY, theme);
    }
  }, []);

  // when theme changes then assign to body tag
  useEffect(() => {
    Object.values(ThemeType).forEach((className) =>
      globalThis.document.body.classList.remove(className),
    );
    globalThis.document.body.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    // get list of themeIds
    const themeList = Object.values(ThemeType);
    const themeIndex = themeList.findIndex((classname) => classname === theme);
    // logic to continuously cycle through array
    const nextThemeIndex = themeIndex === themeList.length - 1 ? 0 : themeIndex + 1;
    let newTheme = themeList[nextThemeIndex];

    // validation check & fallback
    if (!themeList.includes(newTheme)) newTheme = themeList[0];

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
