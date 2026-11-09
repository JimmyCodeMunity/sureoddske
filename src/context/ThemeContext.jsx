import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

/**
 * Wrap your app with <ThemeProvider> and call useTheme() anywhere.
 *
 * defaultTheme: 'light' | 'dark' | 'system'
 */
export function ThemeProvider({ children, defaultTheme = 'dark', storageKey = 'ui-theme' }) {
    const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) || defaultTheme)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.add(systemDark ? 'dark' : 'light')
        } else {
            root.classList.add(theme)
        }
    }, [theme])

    function setAndPersist(newTheme) {
        localStorage.setItem(storageKey, newTheme)
        setTheme(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme: setAndPersist }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
    return ctx
}
