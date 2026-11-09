import { cn } from '@/lib/utils'

/**
 * Spinner — drop into Suspense fallbacks or button loading states
 * <Spinner />                  default medium
 * <Spinner size="sm" />
 * <Spinner size="lg" />
 * <Spinner className="text-white" />
 */
export function Spinner({ size = 'md', className }) {
    const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
    return (
        <svg
            className={cn('animate-spin text-[hsl(var(--primary))]', sizes[size], className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
            role="status"
        >
            <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    )
}

/**
 * Full-screen page loader — used as the Suspense fallback for routes
 */
export function PageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[hsl(var(--background))]">
            <Spinner size="lg" />
            <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
                Loading…
            </p>
        </div>
    )
}

/**
 * Top progress bar — mount it when a navigation/fetch is in-flight.
 * Wrap with <GlobalLoader loading={isLoading} />
 */
export function GlobalLoader({ loading }) {
    if (!loading) return null
    return (
        <div
            className="fixed top-0 left-0 z-50 h-1 w-full overflow-hidden"
            role="progressbar"
            aria-valuetext="Loading"
        >
            <div className="h-full w-3/4 animate-[progress_1.5s_ease-in-out_infinite] rounded-r-full bg-[hsl(var(--primary))]" />
            <style>{`
        @keyframes progress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(133%); }
        }
      `}</style>
        </div>
    )
}
