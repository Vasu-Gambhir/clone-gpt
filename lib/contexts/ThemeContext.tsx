'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * useTheme Hook
 * Provides access to theme state and toggle function
 * Returns fallback values during SSR or before provider initialization
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a fallback during SSR or before provider is ready
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => {}
    };
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider Component
 * Manages application theme state (light/dark mode)
 * Persists theme preference to localStorage and applies to document root
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to dark mode
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Apply theme to document
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="dark">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}