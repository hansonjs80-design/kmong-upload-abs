import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'clinic-theme';

const persistTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme persistence is optional when storage is unavailable.
  }
};

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    persistTheme('light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#6366f1';
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
