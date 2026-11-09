import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const BetSlipContext = createContext(null)
const STORAGE_KEY = 'oddshub_betslip'

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
}

function saveToStorage(slip) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slip)) } catch { }
}

/**
 * Bet slip — stores selected games (not selected odds).
 * Clicking a game card adds it; clicking again removes it.
 * Persisted to localStorage so it survives page refresh.
 */
export function BetSlipProvider({ children }) {
    const [slip, setSlipRaw] = useState(loadFromStorage)
    const [open, setOpen] = useState(false)

    const setSlip = useCallback((updater) => {
        setSlipRaw((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            saveToStorage(next)
            return next
        })
    }, [])

    /** Toggle a game in/out of the slip. No outcome selection needed. */
    const addBet = useCallback((bet) => {
        setSlip((prev) => {
            const exists = prev.some((b) => b.game_id === bet.game_id)
            return exists
                ? prev.filter((b) => b.game_id !== bet.game_id)  // remove
                : [...prev, bet]                                   // add
        })
    }, [setSlip])

    const removeBet = useCallback((game_id) => {
        setSlip((prev) => prev.filter((b) => b.game_id !== game_id))
    }, [setSlip])

    const clearSlip = useCallback(() => setSlip([]), [setSlip])

    // Cross-tab sync
    useEffect(() => {
        const handler = (e) => {
            if (e.key === STORAGE_KEY) setSlipRaw(loadFromStorage())
        }
        window.addEventListener('storage', handler)
        return () => window.removeEventListener('storage', handler)
    }, [])

    return (
        <BetSlipContext.Provider value={{ slip, addBet, removeBet, clearSlip, open, setOpen }}>
            {children}
        </BetSlipContext.Provider>
    )
}

export function useBetSlip() {
    const ctx = useContext(BetSlipContext)
    if (!ctx) throw new Error('useBetSlip must be used within BetSlipProvider')
    return ctx
}
