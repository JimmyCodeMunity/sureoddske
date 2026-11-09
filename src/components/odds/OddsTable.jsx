import { ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GameCard from './GameCard'
import GameSkeleton from './GameSkeleton'

export default function OddsTable({ games, meta, loading, error, onPageChange, betSlip, onAddBet }) {

    if (loading) return <GameSkeleton count={8} />

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-16 gap-3 text-center px-4">
                <AlertCircle className="h-10 w-10 text-[hsl(var(--destructive))]" />
                <p className="font-semibold">Failed to load games</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">{error}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Make sure the backend server is running on port 5000.
                </p>
            </div>
        )
    }

    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-16 gap-3 text-center px-4">
                <Inbox className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                <p className="font-semibold">No games found</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Try adjusting your filters or wait for the next scrape.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Game list */}
            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                {games.map((game) => (
                    <GameCard
                        key={game.game_id}
                        game={game}
                        betSlip={betSlip}
                        onAddBet={onAddBet}
                    />
                ))}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                        Page {meta.page} of {meta.pages} · {meta.total} games
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => onPageChange(meta.page - 1)}
                            disabled={meta.page <= 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {Array.from({ length: meta.pages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === meta.pages || Math.abs(p - meta.page) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                                acc.push(p)
                                return acc
                            }, [])
                            .map((p, idx) =>
                                p === '…' ? (
                                    <span key={`e-${idx}`} className="px-1 text-sm text-[hsl(var(--muted-foreground))]">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === meta.page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => onPageChange(p)}
                                        className="h-8 w-8 p-0 text-xs"
                                    >
                                        {p}
                                    </Button>
                                )
                            )}

                        <Button
                            variant="outline" size="sm"
                            onClick={() => onPageChange(meta.page + 1)}
                            disabled={meta.page >= meta.pages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
