import React, { useEffect, useMemo, useState } from 'react';
import { ThemeContext, THEME_STORAGE_KEY } from './themeContext';

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    });

    const isDarkMode = theme === 'dark';

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        document.documentElement.classList.toggle('dark-mode', isDarkMode);
        document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [isDarkMode, theme]);

    const value = useMemo(() => ({
        theme,
        isDarkMode,
        toggleTheme: () => setTheme((currentTheme) => (
            currentTheme === 'dark' ? 'light' : 'dark'
        ))
    }), [isDarkMode, theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
