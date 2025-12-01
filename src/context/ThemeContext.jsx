import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('christmas');

    useEffect(() => {
        const root = document.documentElement;
        // Remove all previous theme classes
        root.classList.remove('theme-blood', 'theme-nelcyx', 'theme-logofolio', 'theme-brisca', 'theme-christmas');
        // Add new theme class
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
