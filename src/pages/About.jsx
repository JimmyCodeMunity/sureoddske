import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const stack = [
    { name: 'Vite 8', desc: 'Lightning-fast build tool', badge: 'Bundler' },
    { name: 'React 19', desc: 'UI library with concurrent features', badge: 'UI' },
    { name: 'Tailwind v4', desc: 'Utility-first CSS, zero-config', badge: 'Styling' },
    { name: 'shadcn/ui', desc: 'Accessible, composable components', badge: 'Components' },
    { name: 'React Router v7', desc: 'File-based client-side routing', badge: 'Routing' },
    { name: 'Sonner', desc: 'Beautiful toast notifications', badge: 'UX' },
]

export default function About() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">About this template</h1>
                <p className="text-[hsl(var(--muted-foreground))]">
                    A production-ready starter you can clone for every new project.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stack.map(({ name, desc, badge }) => (
                    <Card key={name}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{name}</CardTitle>
                                <Badge variant="secondary">{badge}</Badge>
                            </div>
                            <CardDescription>{desc}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
