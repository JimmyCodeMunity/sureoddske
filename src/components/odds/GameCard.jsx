import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

function formatTime(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const sameDay = (a, b) =>
        a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (sameDay(d, now)) return { day: 'Today', time }
    const tom = new Date(now); tom.setDate(now.getDate() + 1)
    if (sameDay(d, tom)) return { day: 'Tom.', time }
    return { day: d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }), time }
}

function fmt(v) {
    const n = parseFloat(v)
    return isNaN(n) || n === 0 ? '-' : n.toFixed(2)
}

function OddCell({ label, value, selected }) {
    const valid = value != null && parseFloat(value) > 0
    return (
        <div className={cn(
            'flex flex-col items-center justify-center rounded border',
            'px-1.5 py-1 min-w-[36px] sm:min-w-[44px]',
            !valid && 'opacity-30',
            valid && selected
                ? 'bg-[hsl(var(--primary)/0.12)] border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))]'
                : valid
                    ? 'bg-[hsl(var(--muted))] border-transparent text-[hsl(var(--foreground))]'
                    : 'bg-[hsl(var(--muted))] border-transparent text-[hsl(var(--muted-foreground))]'
        )}>
            <span className="text-[8px] sm:text-[9px] leading-none text-[hsl(var(--muted-foreground))] mb-0.5">{label}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold leading-none tabular-nums">{fmt(value)}</span>
        </div>
    )
}

export default function GameCard({ game, betSlip, onAddBet }) {
    const { day, time } = formatTime(game.commence_time)
    const odds = game.odds || {}
    const gg = game.gg || {}
    const league = (game.league || game.sport_key || '').slice(0, 38)
    const isSelected = betSlip?.some((b) => b.game_id === game.game_id)
    const hasGG = gg.yes || gg.no

    function handleClick() {
        onAddBet?.({
            game_id: game.game_id,
            home_team: game.home_team,
            away_team: game.away_team,
            sport_key: game.sport_key,
            league: game.league || '',
            commence_time: game.commence_time,
            odds,
            gg,
        })
    }

    return (
        <button
            onClick={handleClick}
            className={cn(
                'w-full text-left border-b border-[hsl(var(--border))] last:border-0',
                'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                isSelected
                    ? 'bg-[hsl(var(--primary)/0.07)] border-l-2 border-l-[hsl(var(--primary))]'
                    : 'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/0.35)]',
                game.isFeatured && !isSelected && 'border-l-2 border-l-yellow-500/60'
            )}
            aria-pressed={isSelected}
            aria-label={`${isSelected ? 'Remove' : 'Add'} ${game.home_team} vs ${game.away_team}`}
        >
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">

                {/* Checkbox indicator */}
                <div className="w-4 shrink-0 flex items-center justify-center">
                    {isSelected
                        ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" />
                        : <div className="h-4 w-4 rounded-full border-2 border-[hsl(var(--border))]" />}
                </div>

                {/* Time */}
                <div className="w-11 sm:w-13 shrink-0 text-center">
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] leading-none truncate">{day}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[hsl(var(--foreground))] font-mono mt-0.5 tabular-nums">{time}</p>
                </div>

                {/* Teams + league */}
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        'text-[11px] sm:text-xs font-semibold truncate leading-snug',
                        isSelected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'
                    )}>
                        {game.home_team}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5 leading-snug">
                        {game.away_team}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-[hsl(var(--muted-foreground))] truncate mt-0.5 opacity-60">
                        {league}{game.markets_count ? ` · ${game.markets_count}mkts` : ''}
                    </p>
                </div>

                {/* Odds columns */}
                <div className="flex flex-col gap-1 shrink-0">
                    {/* 1X2 row */}
                    <div className="flex gap-0.5 sm:gap-1">
                        <OddCell label="1" value={odds.home} selected={isSelected} />
                        <OddCell label="X" value={odds.draw} selected={isSelected} />
                        <OddCell label="2" value={odds.away} selected={isSelected} />
                    </div>
                    {/* GG row — only show if available */}
                    {hasGG && (
                        <div className="flex gap-0.5 sm:gap-1">
                            <OddCell label="GG" value={gg.yes} selected={isSelected} />
                            <OddCell label="NG" value={gg.no} selected={isSelected} />
                            {/* spacer to align with 1X2 three columns */}
                            <div className="min-w-[36px] sm:min-w-[44px]" />
                        </div>
                    )}
                </div>
            </div>
        </button>
    )
}
