import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--background))] text-center">
            <p className="text-7xl font-bold text-[hsl(var(--primary))]">404</p>
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="text-[hsl(var(--muted-foreground))]">
                The page you're looking for doesn't exist.
            </p>
            <Button asChild>
                <Link to="/">Go home</Link>
            </Button>
        </div>
    )
}
