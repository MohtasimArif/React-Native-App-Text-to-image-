import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = {
    isDarkMode,
    setIsDarkMode: () => setIsDarkMode(!isDarkMode),
    colors: {
      primary: '#582CFF',
      background: isDarkMode ? '#121212' : '#F8F9FF',
      surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      textHeader: isDarkMode ? '#FFFFFF' : '#111827',
      textSecondary: isDarkMode ? '#A0A0A0' : '#6B7280',
      border: isDarkMode ? '#333333' : '#E5E7EB',
      accent: isDarkMode ? '#2A2A2A' : '#F3F0FF',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);