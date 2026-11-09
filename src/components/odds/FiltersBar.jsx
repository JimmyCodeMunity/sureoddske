import { Search, Calendar, X, RefreshCw, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function FiltersBar({ filters, onChange, onReset, total, loading, leagues = [] }) {
    const hasFilters = filters.team || filters.date || filters.league

    return (
        <div className="space-y-2">
            {/* Row 1: search + date + league + clear */}
            <div className="flex flex-wrap gap-2">

                {/* Team search */}
                <div className="relative flex-1 min-w-[140px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                    <Input
                        value={filters.team}
                        onChange={(e) => onChange({ team: e.target.value, page: 1 })}
                        placeholder="Search team…"
                        className="pl-9 h-9 text-sm"
                    />
                    {filters.team && (
                        <button
                            onClick={() => onChange({ team: '', page: 1 })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* League filter dropdown */}
                {leagues.length > 0 && (
                    <div className="relative">
                        <select
                            value={filters.league || ''}
                            onChange={(e) => onChange({ league: e.target.value, page: 1 })}
                            className={cn(
                                'h-9 pl-3 pr-8 rounded-md appearance-none',
                                'border border-[hsl(var(--border))] bg-[hsl(var(--background))]',
                                'text-sm text-[hsl(var(--foreground))]',
                                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
                                'cursor-pointer max-w-[180px] truncate'
                            )}
                        >
                            <option value="">All leagues</option>
                            {leagues.map((l) => (
                                <option key={l} value={l}>{l.length > 30 ? l.slice(0, 28) + '…' : l}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                    </div>
                )}

                {/* Date picker */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))] pointer-events-none z-10" />
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => onChange({ date: e.target.value, page: 1 })}
                        className={cn(
                            'h-9 pl-9 pr-3 w-full sm:w-auto rounded-md',
                            'border border-[hsl(var(--border))] bg-[hsl(var(--background))]',
                            'text-sm text-[hsl(var(--foreground))]',
                            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
                            'cursor-pointer'
                        )}
                    />
                </div>

                {/* Clear all */}
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={onReset} className="h-9 gap-1 text-xs px-2">
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Row 2: odds labels + game count */}
            <div className="flex items-center justify-between gap-2">
                {/* Static 1X2 label — Betika only provides h2h */}
                <div className="flex rounded-md overflow-hidden border border-[hsl(var(--border))] shrink-0">
                    {['1', 'X', '2'].map((l) => (
                        <span
                            key={l}
                            className="px-3 sm:px-4 py-1.5 text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                        >
                            {l}
                        </span>
                    ))}
                </div>

                {/* Count / spinner */}
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    {loading
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <span>{total} game{total !== 1 ? 's' : ''}</span>
                    }
                </div>
            </div>
        </div>
    )
}
