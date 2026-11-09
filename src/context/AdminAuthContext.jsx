import { createContext, useContext, useState, useCallback } from 'react'

const TOKEN_KEY = 'admin_token'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const login = useCallback(async (email, password) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Login failed')
            localStorage.setItem(TOKEN_KEY, data.token)
            setToken(data.token)
            return true
        } catch (err) {
            setError(err.message)
            return false
        } finally {
            setLoading(false)
        }
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
    }, [])

    return (
        <AdminAuthContext.Provider value={{ token, login, logout, loading, error, isAuthed: !!token }}>
            {children}
        </AdminAuthContext.Provider>
    )
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext)
    if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
    return ctx
}
