import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(true);
  const toggle = () => setDark(d => !d);

  const theme = {
    dark,
    toggle,
    bg:           dark ? '#0a0a0f' : '#f8f9fc',
    bg2:          dark ? '#111118' : '#ffffff',
    bg3:          dark ? '#1a1a24' : '#f1f3f9',
    bg4:          dark ? '#22222e' : '#e8ebf4',
    card:         dark ? '#13131a' : '#ffffff',
    cardHover:    dark ? '#1a1a24' : '#f8f9fc',
    border:       dark ? '#2a2a3a' : '#e2e6f0',
    borderHover:  dark ? '#3a3a50' : '#c8cfe0',
    text:         dark ? '#f0f0ff' : '#0f1117',
    textMuted:    dark ? '#8888aa' : '#5a6072',
    textFaint:    dark ? '#44445a' : '#aab0c0',
    inputBg:      dark ? '#1a1a24' : '#ffffff',
    accent:       '#6366f1',
    accentHover:  '#4f46e5',
    accentLight:  dark ? '#6366f120' : '#6366f115',
    success:      '#10b981',
    successLight: dark ? '#10b98120' : '#10b98115',
    warning:      '#f59e0b',
    warningLight: dark ? '#f59e0b20' : '#f59e0b15',
    danger:       '#ef4444',
    dangerLight:  dark ? '#ef444420' : '#ef444415',
    colTodo:      dark ? '#1a1a2e' : '#eff6ff',
    colProgress:  dark ? '#1a1a10' : '#fffbeb',
    colDone:      dark ? '#0a1a0f' : '#f0fdf4',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);