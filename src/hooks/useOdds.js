import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = '/api/odds'

/**
 * Fetches paginated games from the backend.
 * Aborts the in-flight request whenever filters change.
 */
export function useOdds(filters) {
    const [games, setGames] = useState([])
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)

    const fetchOdds = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()
            if (filters.sport) params.set('sport', filters.sport)
            if (filters.league) params.set('league', filters.league)
            if (filters.date) params.set('date', filters.date)
            if (filters.team) params.set('team', filters.team)
            params.set('page', filters.page || 1)
            params.set('limit', filters.limit || 20)

            const res = await fetch(`${BASE}?${params.toString()}`, { signal: controller.signal })
            if (!res.ok) throw new Error(`Server error ${res.status}`)

            const data = await res.json()
            setGames(data.games || [])
            setMeta({ total: data.total ?? 0, page: data.page ?? 1, pages: data.pages ?? 1 })
        } catch (err) {
            if (err.name === 'AbortError') return
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [filters.sport, filters.league, filters.date, filters.team, filters.page, filters.limit])

    useEffect(() => {
        fetchOdds()
        return () => abortRef.current?.abort()
    }, [fetchOdds])

    return { games, meta, loading, error, refetch: fetchOdds }
}

/** Fetches distinct sport keys from the DB. */
export function useSports() {
    const [sports, setSports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${BASE}/sports`)
            .then((r) => r.json())
            .then((d) => setSports(d.sports || []))
            .catch(() => setSports([]))
            .finally(() => setLoading(false))
    }, [])

    return { sports, loading }
}

/** Fetches distinct league strings from the DB for the filter dropdown. */
export function useLeagues(sport) {
    const [leagues, setLeagues] = useState([])

    useEffect(() => {
        const params = sport ? `?sport=${encodeURIComponent(sport)}` : ''
        fetch(`${BASE}/leagues${params}`)
            .then((r) => r.json())
            .then((d) => setLeagues(d.leagues || []))
            .catch(() => setLeagues([]))
    }, [sport])

    return { leagues }
}
