'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初期化時にダークモードの状態を設定
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    console.log('Initial Theme State:', {
      savedTheme,
      prefersDark,
      shouldBeDark,
      hasDarkClass: document.documentElement.classList.contains('dark')
    });
    
    // 即座にクラスを設定
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsDarkMode(shouldBeDark);
  }, []);

  // システムの設定変更を監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newValue = e.matches;
        setIsDarkMode(newValue);
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    
    // デバッグ用のログを追加
    console.log('Toggle Dark Mode:', {
      newValue,
      hasDarkClass: document.documentElement.classList.contains('dark'),
      currentTheme: localStorage.getItem('theme')
    });
    
    // 即座にクラスを更新
    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // 更新後の状態を確認
    console.log('After Toggle:', {
      hasDarkClass: document.documentElement.classList.contains('dark'),
      currentTheme: localStorage.getItem('theme')
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 