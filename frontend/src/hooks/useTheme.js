'use client'

import { useTheme as useThemeContext } from '@/context/ThemeContext';

export const useTheme = () => {
  const { theme, toggleTheme, setThemeMode } = useThemeContext();
  const isDark = theme === 'dark';
  
  return {
    theme,
    isDark,
    toggleTheme,
    setThemeMode
  };
};