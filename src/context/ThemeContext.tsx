/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('healtlab-theme');
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
      return false;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setDarkModeState((prev) => {
      const next = !prev;
      localStorage.setItem('healtlab-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    localStorage.setItem('healtlab-theme', val ? 'dark' : 'light');
  };

  useEffect(() => {
    localStorage.setItem('healtlab-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
};
