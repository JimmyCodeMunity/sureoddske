import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    RefreshCw, LogOut, Settings, Eye, EyeOff, Star, StarOff,
    Database, TrendingUp, Calendar, Loader2,
    CheckCircle2, AlertCircle, ChevronDown, LayoutDashboard,
    Gamepad2, Zap, X, Globe, SlidersHorizontal, Monitor, ReceiptText,
    Phone, Banknote, ShoppingCart, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { useAdminFetch } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'settings', label: 'Scrape Settings', icon: Settings },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'logs', label: 'Slip Logs', icon: ReceiptText },
]

// ── Reusable sub-components ───────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)]">
                <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
            </span>
            <div className="min-w-0">
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{label}</p>
                <p className="text-xl font-bold leading-tight">{value ?? '—'}</p>
                {sub && <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-snug">{sub}</p>}
            </div>
        </div>
    )
}

function Banner({ msg }) {
    if (!msg) return null
    return (
        <div className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm',
            msg.type === 'success'
                ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]'
        )}>
            {msg.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            <span className="break-words">{msg.text}</span>
        </div>
    )
}

function Busy() {
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />
}

function SyncLog({ lines, onClose }) {
    const bottomRef = useRef(null)
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [lines])

    if (!lines.length) return null
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                    Scraper Log
                </span>
                <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="max-h-56 overflow-y-auto p-3 font-mono text-[11px] space-y-0.5">
                {lines.map((l, i) => (
                    <p key={i} className={cn(
                        'leading-relaxed',
                        l.includes('Error') || l.includes('error') ? 'text-[hsl(var(--destructive))]' :
                            l.includes('Done') || l.includes('saved') ? 'text-[hsl(var(--primary))]' :
                                'text-[hsl(var(--muted-foreground))]'
                    )}>
                        {l}
                    </p>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { token, logout, isAuthed } = useAdminAuth()
    const { get, put, patch, post } = useAdminFetch(token)
    const navigate = useNavigate()

    // Tab state
    const [tab, setTab] = useState('overview')
    const [tabMenuOpen, setTabMenuOpen] = useState(false)

    // Data
    const [stats, setStats] = useState(null)
    const [settings, setSettings] = useState(null)  // scraper settings
    const [games, setGames] = useState([])
    const [gamesTotal, setGamesTotal] = useState(0)
    const [gamesPage, setGamesPage] = useState(1)
    const [gamesPages, setGamesPages] = useState(1)
    const [gamesFilter, setGamesFilter] = useState('')    // sport_key filter
    const [dbSports, setDbSports] = useState([])

    // UI state
    const [busySync, setBusySync] = useState(false)
    const [busySave, setBusySave] = useState(false)
    const [busyGame, setBusyGame] = useState(null)
    const [saveMsg, setSaveMsg] = useState(null)
    const [syncLog, setSyncLog] = useState([])

    // Slip logs state
    const [slipLogs, setSlipLogs] = useState([])
    const [slipLogsTotal, setSlipLogsTotal] = useState(0)
    const [slipLogsPages, setSlipLogsPages] = useState(1)
    const [slipLogsPage, setSlipLogsPage] = useState(1)
    const [slipStats, setSlipStats] = useState(null)
    const [slipFilter, setSlipFilter] = useState('')

    // Auth guard
    useEffect(() => {
        if (!isAuthed) navigate('/admin', { replace: true })
    }, [isAuthed, navigate])

    // ── Load data ─────────────────────────────────────────────────────────────

    const loadStats = useCallback(async () => {
        try {
            const data = await get('/api/admin/stats')
            setStats(data)
            // Initialise settings from what the backend returns
            setSettings(data.settings || {
                scrapeUrl: 'https://www.betika.com/en-ke/',
                scrollSteps: 6,
                headless: true,
            })
        } catch (err) { console.error(err) }
    }, [get])

    const loadGames = useCallback(async (page = 1, sport = '') => {
        try {
            const qs = new URLSearchParams({ page, limit: 25 })
            if (sport) qs.set('sport', sport)
            const data = await get(`/api/admin/games?${qs}`)
            setGames(data.games || [])
            setGamesTotal(data.total || 0)
            setGamesPage(data.page || 1)
            setGamesPages(data.pages || 1)
        } catch (err) { console.error(err) }
    }, [get])

    const loadSports = useCallback(async () => {
        try {
            const data = await get('/api/odds/sports')
            setDbSports(data.sports || [])
        } catch { setDbSports([]) }
    }, [get])

    const loadLogs = useCallback(async (page = 1, status = '') => {
        try {
            const qs = new URLSearchParams({ page, limit: 30 })
            if (status) qs.set('status', status)
            const data = await get(`/api/admin/slip-logs?${qs}`)
            setSlipLogs(data.logs || [])
            setSlipLogsTotal(data.total || 0)
            setSlipLogsPages(data.pages || 1)
            setSlipLogsPage(data.page || 1)
            setSlipStats(data.stats || null)
        } catch (err) { console.error(err) }
    }, [get])

    useEffect(() => { loadStats() }, [loadStats])
    useEffect(() => { loadSports() }, [loadSports])
    useEffect(() => {
        if (tab === 'games') loadGames(gamesPage, gamesFilter)
    }, [tab, gamesPage, gamesFilter, loadGames])
    useEffect(() => {
        if (tab === 'logs') loadLogs(slipLogsPage, slipFilter)
    }, [tab, slipLogsPage, slipFilter, loadLogs])

    // ── Helpers ───────────────────────────────────────────────────────────────

    function flash(type, text) {
        setSaveMsg({ type, text })
        setTimeout(() => setSaveMsg(null), 5000)
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    async function handleForceScrape() {
        setBusySync(true)
        setSyncLog([])
        try {
            const data = await post('/api/admin/force-scrape', {})
            // Show the scraper log lines returned by backend
            if (data.log?.length) setSyncLog(data.log)
            flash('success', `Scrape complete · ${data.total} games (${data.upserted} new, ${data.modified} updated)`)
            loadStats()
            loadSports()
            if (tab === 'games') loadGames(1, gamesFilter)
        } catch (err) {
            setSyncLog((p) => [...p, `Error: ${err.message}`])
            flash('error', err.message)
        } finally {
            setBusySync(false)
        }
    }

    async function handleSaveSettings() {
        setBusySave(true)
        try {
            await put('/api/admin/settings', {
                scrapeUrl: settings.scrapeUrl,
                scrollSteps: settings.scrollSteps,
                headless: settings.headless,
            })
            flash('success', 'Settings saved. Changes apply on next scrape.')
        } catch (err) {
            flash('error', err.message)
        } finally {
            setBusySave(false)
        }
    }

    async function handleToggleHide(game_id) {
        try { await patch(`/api/admin/games/${game_id}/hide`); loadGames(gamesPage, gamesFilter) }
        catch (err) { flash('error', err.message) }
    }

    async function handleToggleFeature(game_id) {
        try { await patch(`/api/admin/games/${game_id}/feature`); loadGames(gamesPage, gamesFilter) }
        catch (err) { flash('error', err.message) }
    }

    function switchTab(id) { setTab(id); setTabMenuOpen(false) }

    const activeTab = TABS.find((t) => t.id === tab)

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

            {/* ── Header ── */}
            <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.97)] backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">

                    {/* Brand */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--primary))]">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </span>
                        <span className="font-bold text-sm hidden sm:inline">OddsHub</span>
                        <span className="rounded bg-[hsl(var(--primary)/0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--primary))]">
                            ADMIN
                        </span>
                    </div>

                    {/* Mobile tab dropdown */}
                    <div className="relative sm:hidden flex-1 max-w-[160px]">
                        <button
                            onClick={() => setTabMenuOpen((o) => !o)}
                            className="flex w-full items-center justify-between gap-1 rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium bg-[hsl(var(--card))]"
                        >
                            <span className="flex items-center gap-1.5">
                                {activeTab && <activeTab.icon className="h-3.5 w-3.5" />}
                                {activeTab?.label}
                            </span>
                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', tabMenuOpen && 'rotate-180')} />
                        </button>
                        {tabMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl z-50 overflow-hidden">
                                {TABS.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => switchTab(t.id)}
                                        className={cn(
                                            'flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                                            t.id === tab
                                                ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium'
                                                : 'hover:bg-[hsl(var(--muted))]'
                                        )}
                                    >
                                        <t.icon className="h-4 w-4" />{t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            variant="outline" size="sm"
                            onClick={handleForceScrape}
                            disabled={busySync}
                            className="h-8 gap-1.5 text-xs"
                        >
                            {busySync ? <Busy /> : <Zap className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">Scrape Now</span>
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => { logout(); navigate('/admin', { replace: true }) }}
                            className="h-8 gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>

                {/* Desktop tab bar */}
                <div className="mx-auto hidden sm:flex max-w-6xl px-4 border-t border-[hsl(var(--border)/0.5)]">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                                tab === t.id
                                    ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                            )}
                        >
                            <t.icon className="h-3.5 w-3.5" />{t.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-3 sm:px-4 py-5 space-y-4 pb-12">

                <Banner msg={saveMsg} />
                <SyncLog lines={syncLog} onClose={() => setSyncLog([])} />

                {/* ── OVERVIEW ─────────────────────────────────────────────── */}
                {tab === 'overview' && (
                    <div className="space-y-5">
                        <h2 className="font-semibold">Overview</h2>
                        {stats ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <StatCard icon={Database} label="Total Games" value={stats.totalGames} />
                                    <StatCard icon={Calendar} label="Upcoming" value={stats.upcomingGames} />
                                    <StatCard icon={TrendingUp} label="Sports" value={stats.totalSports} />
                                    <StatCard icon={EyeOff} label="Hidden" value={stats.hiddenGames} />
                                    <StatCard
                                        icon={Star}
                                        label="Featured"
                                        value={stats.featuredGames}
                                        sub={stats.lastSync
                                            ? `Last scrape: ${new Date(stats.lastSync).toLocaleString()}`
                                            : 'Never scraped'}
                                    />
                                </div>

                                {/* Scraper config summary */}
                                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                        <p className="font-medium text-sm">Active Scraper Config</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="space-y-0.5">
                                            <p className="text-[hsl(var(--muted-foreground))]">URL</p>
                                            <p className="font-medium truncate">{stats.settings?.scrapeUrl || '—'}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[hsl(var(--muted-foreground))]">Scroll Steps</p>
                                            <p className="font-medium">{stats.settings?.scrollSteps ?? 6}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[hsl(var(--muted-foreground))]">Headless</p>
                                            <p className="font-medium">{stats.settings?.headless !== false ? 'Yes' : 'No (visible)'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sports in DB */}
                                {dbSports.length > 0 && (
                                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
                                        <p className="font-medium text-sm">Sports in Database</p>
                                        <div className="flex flex-wrap gap-2">
                                            {dbSports.map((s) => (
                                                <span
                                                    key={s}
                                                    className="rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] px-3 py-1 text-xs font-medium"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
                            </div>
                        )}
                    </div>
                )}

                {/* ── SETTINGS ─────────────────────────────────────────────── */}
                {tab === 'settings' && (
                    <div className="space-y-5 max-w-lg">
                        <h2 className="font-semibold">Scraper Settings</h2>
                        {settings ? (
                            <>
                                {/* Scrape URL */}
                                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                        <p className="font-medium text-sm">Betika URL</p>
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                                        The Betika page to scrape. Change this to target a different region/locale.
                                    </p>
                                    <Input
                                        value={settings.scrapeUrl || ''}
                                        onChange={(e) => setSettings((s) => ({ ...s, scrapeUrl: e.target.value }))}
                                        placeholder="https://www.betika.com/en-ke/"
                                        className="text-sm h-9"
                                    />
                                </div>

                                {/* Scroll steps */}
                                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                        <p className="font-medium text-sm">Scroll Steps</p>
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                                        How many times to scroll down on the Betika page. More scrolls = more games loaded but slower scrape. Range: 1–20.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={1} max={20}
                                            value={settings.scrollSteps ?? 6}
                                            onChange={(e) => setSettings((s) => ({ ...s, scrollSteps: parseInt(e.target.value) }))}
                                            className="flex-1 accent-[hsl(var(--primary))]"
                                        />
                                        <span className="text-sm font-bold w-6 text-center tabular-nums">
                                            {settings.scrollSteps ?? 6}
                                        </span>
                                    </div>
                                </div>

                                {/* Headless mode */}
                                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                        <p className="font-medium text-sm">Browser Mode</p>
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                                        Headless runs the browser silently (recommended for production). Visible mode opens a real browser window — useful for debugging.
                                    </p>
                                    <div className="flex rounded-md overflow-hidden border border-[hsl(var(--border))] w-fit">
                                        {[true, false].map((val) => (
                                            <button
                                                key={String(val)}
                                                onClick={() => setSettings((s) => ({ ...s, headless: val }))}
                                                className={cn(
                                                    'px-4 py-2 text-xs font-medium transition-colors',
                                                    settings.headless === val
                                                        ? 'bg-[hsl(var(--primary))] text-white'
                                                        : 'bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                                                )}
                                            >
                                                {val ? 'Headless' : 'Visible'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Save */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button onClick={handleSaveSettings} disabled={busySave} className="gap-2">
                                        {busySave ? <Busy /> : <Settings className="h-4 w-4" />}
                                        Save Settings
                                    </Button>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Changes apply on the next scrape.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
                            </div>
                        )}
                    </div>
                )}

                {/* ── GAMES ────────────────────────────────────────────────── */}
                {tab === 'games' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 justify-between">
                            <h2 className="font-semibold">Games ({gamesTotal})</h2>
                            <div className="flex items-center gap-2">
                                <select
                                    value={gamesFilter}
                                    onChange={(e) => { setGamesFilter(e.target.value); setGamesPage(1) }}
                                    className="h-8 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                >
                                    <option value="">All sports</option>
                                    {dbSports.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                    {gamesPage} / {gamesPages}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                            {games.length === 0 ? (
                                <div className="py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                    No games in database yet. Click "Scrape Now" to pull from Betika.
                                </div>
                            ) : games.map((g) => (
                                <div
                                    key={g.game_id}
                                    className={cn(
                                        'flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3',
                                        'border-b border-[hsl(var(--border))] last:border-0',
                                        'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/0.35)] transition-colors',
                                        g.isHidden && 'opacity-40'
                                    )}
                                >
                                    {/* Status badges */}
                                    <div className="hidden sm:flex w-14 shrink-0 flex-col gap-1 pt-0.5">
                                        {g.isFeatured && (
                                            <span className="rounded bg-yellow-500/15 text-yellow-500 px-1.5 py-1 text-[10px] font-semibold text-center leading-none">
                                                ⭐ Hot
                                            </span>
                                        )}
                                        {g.isHidden && (
                                            <span className="rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 py-1 text-[10px] font-semibold text-center leading-none">
                                                Hidden
                                            </span>
                                        )}
                                    </div>

                                    {/* Game info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">
                                            {g.home_team}
                                            <span className="text-[hsl(var(--muted-foreground))] mx-1 font-normal">vs</span>
                                            {g.away_team}
                                        </p>
                                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                                            {g.league || g.sport_key} · {new Date(g.commence_time).toLocaleDateString([], {
                                                weekday: 'short', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                        {/* Odds preview */}
                                        {g.odds && (
                                            <div className="flex gap-2 mt-1.5 text-[10px] font-mono">
                                                {g.odds.home && (
                                                    <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[hsl(var(--foreground))]">
                                                        1 {Number(g.odds.home).toFixed(2)}
                                                    </span>
                                                )}
                                                {g.odds.draw && (
                                                    <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[hsl(var(--foreground))]">
                                                        X {Number(g.odds.draw).toFixed(2)}
                                                    </span>
                                                )}
                                                {g.odds.away && (
                                                    <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[hsl(var(--foreground))]">
                                                        2 {Number(g.odds.away).toFixed(2)}
                                                    </span>
                                                )}
                                                {g.markets_count && (
                                                    <span className="text-[hsl(var(--muted-foreground))]">
                                                        +{g.markets_count} mkts
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggleFeature(g.game_id)}
                                            title={g.isFeatured ? 'Unfeature' : 'Feature'}
                                            className={cn(
                                                'p-2 rounded-md transition-colors',
                                                g.isFeatured
                                                    ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20'
                                                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                                            )}
                                        >
                                            {g.isFeatured
                                                ? <Star className="h-4 w-4 fill-current" />
                                                : <StarOff className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleToggleHide(g.game_id)}
                                            title={g.isHidden ? 'Show game' : 'Hide game'}
                                            className={cn(
                                                'p-2 rounded-md transition-colors',
                                                g.isHidden
                                                    ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] hover:bg-[hsl(var(--primary)/0.2)]'
                                                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                                            )}
                                        >
                                            {g.isHidden
                                                ? <Eye className="h-4 w-4" />
                                                : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {gamesPages > 1 && (
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setGamesPage((p) => Math.max(1, p - 1))}
                                    disabled={gamesPage <= 1}
                                >
                                    ← Prev
                                </Button>
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                    {gamesPage} / {gamesPages}
                                </span>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setGamesPage((p) => Math.min(gamesPages, p + 1))}
                                    disabled={gamesPage >= gamesPages}
                                >
                                    Next →
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SLIP LOGS ─────────────────────────────────────────────── */}
                {tab === 'logs' && (
                    <div className="space-y-4">
                        <h2 className="font-semibold">Slip Logs</h2>

                        {/* Stats row */}
                        {slipStats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Paid', value: slipStats.paid, color: 'text-[hsl(var(--primary))]' },
                                    { label: 'Pending', value: slipStats.pending, color: 'text-yellow-500' },
                                    { label: 'Abandoned', value: slipStats.abandoned, color: 'text-[hsl(var(--muted-foreground))]' },
                                    { label: 'Revenue', value: `KES ${Number(slipStats.total_revenue_kes).toFixed(0)}`, color: 'text-[hsl(var(--primary))]' },
                                ].map((s) => (
                                    <div key={s.label} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
                                        <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Filter tabs */}
                        <div className="flex gap-1 overflow-x-auto">
                            {[
                                { id: '', label: 'All' },
                                { id: 'paid', label: '✅ Paid' },
                                { id: 'pending', label: '⏳ Pending' },
                                { id: 'abandoned', label: '🚪 Abandoned' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => { setSlipFilter(f.id); setSlipLogsPage(1) }}
                                    className={cn(
                                        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                                        slipFilter === f.id
                                            ? 'bg-[hsl(var(--primary))] text-white'
                                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Logs table */}
                        <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                            {slipLogs.length === 0 ? (
                                <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                    No logs yet. Users need to start selecting games.
                                </div>
                            ) : slipLogs.map((log) => (
                                <div key={log._id}
                                    className={cn(
                                        'flex items-start gap-3 px-3 sm:px-4 py-3',
                                        'border-b border-[hsl(var(--border))] last:border-0',
                                        'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/0.35)] transition-colors'
                                    )}
                                >
                                    {/* Status dot */}
                                    <div className="mt-1 shrink-0">
                                        <span className={cn(
                                            'inline-block h-2 w-2 rounded-full',
                                            log.status === 'paid' ? 'bg-[hsl(var(--primary))]' :
                                                log.status === 'pending' ? 'bg-yellow-500' :
                                                    'bg-[hsl(var(--muted-foreground))]'
                                        )} />
                                    </div>

                                    {/* Main info */}
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                                                {log.phone || '—'}
                                            </span>
                                            <span className={cn(
                                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                                log.status === 'paid' ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]' :
                                                    log.status === 'pending' ? 'bg-yellow-500/15 text-yellow-600' :
                                                        'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                                            )}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                            {log.game_count} game{log.game_count !== 1 ? 's' : ''} · KES {((log.amount_cents || 0) / 100).toFixed(0)}
                                            {log.reference && ` · ref: ${log.reference.slice(0, 12)}…`}
                                        </p>
                                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-60">
                                            {new Date(log.createdAt).toLocaleString()}
                                            {log.paid_at && ` → paid ${new Date(log.paid_at).toLocaleString()}`}
                                        </p>
                                        {/* Games list */}
                                        {log.games?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {log.games.slice(0, 4).map((g, gi) => (
                                                    <span key={gi} className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[9px] text-[hsl(var(--muted-foreground))] truncate max-w-[120px]">
                                                        {g.match}
                                                    </span>
                                                ))}
                                                {log.games.length > 4 && (
                                                    <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                                                        +{log.games.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {slipLogsPages > 1 && (
                            <div className="flex items-center justify-between">
                                <Button variant="outline" size="sm"
                                    onClick={() => setSlipLogsPage((p) => Math.max(1, p - 1))}
                                    disabled={slipLogsPage <= 1}>
                                    ← Prev
                                </Button>
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                    {slipLogsPage} / {slipLogsPages} · {slipLogsTotal} total
                                </span>
                                <Button variant="outline" size="sm"
                                    onClick={() => setSlipLogsPage((p) => Math.min(slipLogsPages, p + 1))}
                                    disabled={slipLogsPage >= slipLogsPages}>
                                    Next →
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
