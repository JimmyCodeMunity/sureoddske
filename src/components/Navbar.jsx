import { NavLink } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

const links = [
    { to: '/', label: 'Home', end: true },
    // 🔧 Add nav links here
]

export default function Navbar() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.8)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background)/0.6)]">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                {/* Brand */}
                <NavLink
                    to="/"
                    className="text-lg font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                    Qode Template
                </NavLink>

                {/* Nav links */}
                <nav className="flex items-center gap-1">
                    {links.map(({ to, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                                )
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    )
}
