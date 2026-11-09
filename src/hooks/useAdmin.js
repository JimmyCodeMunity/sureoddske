import { useCallback } from 'react'

/**
 * Authenticated fetch helper.
 * Provides get / post / put / patch with JWT bearer token attached.
 */
export function useAdminFetch(token) {

    // Stable helper — parse JSON and throw on non-OK
    const handleRes = useCallback(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        return data
    }, [])

    const authHeaders = useCallback((withBody = false) => ({
        Authorization: `Bearer ${token}`,
        ...(withBody ? { 'Content-Type': 'application/json' } : {}),
    }), [token])

    const get = useCallback(
        (path) =>
            fetch(path, { headers: authHeaders(false) }).then(handleRes),
        [authHeaders, handleRes]
    )

    const post = useCallback(
        (path, body) =>
            fetch(path, {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(body),
            }).then(handleRes),
        [authHeaders, handleRes]
    )

    const put = useCallback(
        (path, body) =>
            fetch(path, {
                method: 'PUT',
                headers: authHeaders(true),
                body: JSON.stringify(body),
            }).then(handleRes),
        [authHeaders, handleRes]
    )

    const patch = useCallback(
        (path) =>
            fetch(path, {
                method: 'PATCH',
                headers: authHeaders(false),
            }).then(handleRes),
        [authHeaders, handleRes]
    )

    return { get, post, put, patch }
}
