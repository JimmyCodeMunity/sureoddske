import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useOdds, useSports, useLeagues } from '@/hooks/useOdds'
import { useBetSlip } from '@/context/BetSlipContext'
import SportsTabs from '@/components/odds/SportsTabs'
import FiltersBar from '@/components/odds/FiltersBar'
import OddsTable from '@/components/odds/OddsTable'

const DEFAULT_FILTERS = {
    sport: null,
    league: '',
    date: '',
    team: '',
    page: 1,
    limit: 25,
}

export default function Home() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS)
    const { slip, addBet, setOpen } = useBetSlip()

    const { sports, loading: sportsLoading } = useSports()
    const { leagues } = useLeagues(filters.sport)
    const { games, meta, loading, error, refetch } = useOdds(filters)

    const updateFilters = useCallback((patch) => {
        setFilters((prev) => ({ ...prev, ...patch }))
    }, [])

    function handleSportSelect(sport) {
        // Reset league when switching sport
        updateFilters({ sport, league: '', page: 1 })
    }

    function handlePageChange(page) {
        updateFilters({ page })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleReset() {
        setFilters(DEFAULT_FILTERS)
    }

    function handleAddBet(bet) {
        addBet(bet)
        if (slip.length === 0) setOpen(true)
    }

    async function handleManualScrape() {
        const tid = toast.loading('Scraping latest games from Betika…')
        try {
            const res = await fetch('/api/odds/sync', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Scrape failed')
            toast.success(`Scraped ${data.total} games`, {
                id: tid,
                description: `${data.upserted} new · ${data.modified} updated`,
            })
            refetch()
        } catch (err) {
            toast.error('Scrape failed', { id: tid, description: err.message })
        }
    }

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight">Upcoming Odds</h1>
                    {/* <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        Scraped from Betika · auto-refreshed every 6 hours
                    </p> */}
                </div>
                {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualScrape}
                    className="gap-1.5 text-xs h-8 shrink-0"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Scrape Now</span>
                    <span className="sm:hidden">Sync</span>
                </Button> */}
            </div>

            {/* ── Sport tabs ── */}
            <SportsTabs
                sports={sportsLoading ? [] : sports}
                selected={filters.sport}
                onSelect={handleSportSelect}
            />

            {/* ── Filters bar ── */}
            <FiltersBar
                filters={filters}
                onChange={updateFilters}
                onReset={handleReset}
                total={meta.total}
                loading={loading}
                leagues={leagues}
            />

            {/* ── Games ── */}
            <OddsTable
                games={games}
                meta={meta}
                loading={loading}
                error={error}
                onPageChange={handlePageChange}
                betSlip={slip}
                onAddBet={handleAddBet}
            />
        </div>
    )
}
