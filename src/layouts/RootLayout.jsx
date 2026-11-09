import { Suspense } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PageLoader } from '@/components/ui/loader'
import { TrendingUp } from 'lucide-react'
import BetSlipDrawer from '@/components/BetSlipDrawer'

function NavItem({ to, end, children }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                }`
            }
        >
            {children}
        </NavLink>
    )
}

export default function RootLayout() {
    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.97)] backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-4">

                    {/* Brand */}
                    <NavLink
                        to="/"
                        className="flex items-center gap-2 font-bold text-sm sm:text-base text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--primary))] shrink-0">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </span>
                        OddsHub
                    </NavLink>

                    {/* Nav + theme toggle */}
                    <div className="flex items-center gap-1">
                        <NavItem to="/" end>Odds</NavItem>
                        <div className="ml-1 border-l border-[hsl(var(--border))] pl-2">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Live ticker strip ── */}
            <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.05)] overflow-hidden">
                <p className="px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] text-[hsl(var(--muted-foreground))] whitespace-nowrap overflow-hidden text-ellipsis">
                    🟢 Odds updated every 6&nbsp;hours &nbsp;·&nbsp; No login required &nbsp;·&nbsp; Best odds across all bookmakers
                </p>
            </div>

            {/* ── Page content ── */}
            {/*
                pb-24 gives space so the FAB (bottom-5 = 20px + ~56px height) never sits
                on top of the last card on mobile.
            */}
            <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-5 pb-24 sm:pb-28">
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                <div className="mx-auto max-w-7xl px-3 sm:px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        © {new Date().getFullYear()} OddsHub · For informational purposes only
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        Odds sourced from The-Odds-API · Synced every 6 hours
                    </p>
                </div>
            </footer>

            {/* ── Toast notifications ── */}
            <Toaster
                position="bottom-left"
                richColors
                toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
            />

            {/* ── Bet slip drawer + FAB ── */}
            <BetSlipDrawer />
        </div>
    )
}
