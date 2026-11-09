import { cn } from '@/lib/utils'

// Betika-derived sport keys from scraperService.js deriveSportKey()
const SPORT_META = {
    soccer: { label: 'Football', emoji: '⚽' },
    basketball: { label: 'Basketball', emoji: '🏀' },
    tennis: { label: 'Tennis', emoji: '🎾' },
    rugby: { label: 'Rugby', emoji: '🏉' },
    cricket: { label: 'Cricket', emoji: '🏏' },
    hockey: { label: 'Hockey', emoji: '🏒' },
    volleyball: { label: 'Volleyball', emoji: '🏐' },
    handball: { label: 'Handball', emoji: '🤾' },
    american_football: { label: 'Am. Football', emoji: '🏈' },
    baseball: { label: 'Baseball', emoji: '⚾' },
    combat_sports: { label: 'Combat', emoji: '🥊' },
}

export function getSportLabel(key) {
    if (!key) return 'All'
    const meta = SPORT_META[key]
    if (meta) return `${meta.emoji} ${meta.label}`
    // Fallback: prettify the raw key
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function SportsTabs({ sports, selected, onSelect }) {
    const all = [null, ...sports]

    return (
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {all.map((sport) => {
                const isActive = selected === sport
                return (
                    <button
                        key={sport ?? '__all__'}
                        onClick={() => onSelect(sport)}
                        className={cn(
                            'flex-shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium',
                            'transition-all whitespace-nowrap',
                            isActive
                                ? 'bg-[hsl(var(--primary))] text-white shadow'
                                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/0.15)] hover:text-[hsl(var(--foreground))]'
                        )}
                    >
                        {sport === null ? '🌍 All' : getSportLabel(sport)}
                    </button>
                )
            })}
        </div>
    )
}
