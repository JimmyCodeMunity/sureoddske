import { cn } from '@/lib/utils'

function Shimmer({ className }) {
    return (
        <div
            className={cn(
                'rounded bg-[hsl(var(--muted))] animate-pulse',
                className
            )}
        />
    )
}

function GameRowSkeleton() {
    return (
        <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3">
            {/* Time + league */}
            <div className="w-14 shrink-0 space-y-1.5">
                <Shimmer className="h-3 w-10" />
                <Shimmer className="h-3 w-12" />
            </div>

            {/* Teams */}
            <div className="flex-1 space-y-1.5 min-w-0">
                <Shimmer className="h-4 w-3/5" />
                <Shimmer className="h-4 w-2/5" />
            </div>

            {/* Odds buttons */}
            <div className="flex gap-2 shrink-0">
                <Shimmer className="h-9 w-16 rounded-md" />
                <Shimmer className="h-9 w-16 rounded-md" />
                <Shimmer className="h-9 w-16 rounded-md" />
            </div>
        </div>
    )
}

export default function GameSkeleton({ count = 8 }) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]">
            {Array.from({ length: count }).map((_, i) => (
                <GameRowSkeleton key={i} />
            ))}
        </div>
    )
}
