'use client'

import { createContext, useState, useContext, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Fonction pour obtenir le thème initial
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      // Appliquer immédiatement au document
      document.documentElement.classList.add(savedTheme);
      return savedTheme;
    }
    
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === 'dark';

  // Fonction pour appliquer le thème au DOM
  const applyTheme = useCallback((newTheme) => {
    if (typeof window === 'undefined') return;
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  // Basculer le thème
  const toggleTheme = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  }, [isDark, applyTheme]);

  // Définir un thème spécifique
  const setThemeMode = useCallback((mode) => {
    if (mode !== 'light' && mode !== 'dark') return;
    setTheme(mode);
    applyTheme(mode);
  }, [applyTheme]);

  // Valeur du contexte
  const contextValue = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setThemeMode
  }), [theme, isDark, toggleTheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};