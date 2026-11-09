import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/context/AdminAuthContext'

export default function AdminLogin() {
    const { login, loading, error, isAuthed } = useAdminAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [show, setShow] = useState(false)

    // Already logged in — bounce straight to dashboard
    if (isAuthed) {
        navigate('/admin/dashboard', { replace: true })
        return null
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const ok = await login(email, password)
        if (ok) navigate('/admin/dashboard', { replace: true })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4 py-8">
            <div className="w-full max-w-sm space-y-6">
                {/* Brand */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))]">
                        <TrendingUp className="h-6 w-6 text-white" />
                    </span>
                    <h1 className="text-2xl font-bold">OddsHub Admin</h1>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Sign in to manage games and settings
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
                >
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[hsl(var(--foreground))]">Email</label>
                        <Input
                            type="email"
                            placeholder="admin@oddshub.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[hsl(var(--foreground))]">Password</label>
                        <div className="relative">
                            <Input
                                type={show ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShow((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                aria-label={show ? 'Hide password' : 'Show password'}
                            >
                                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="rounded-md bg-[hsl(var(--destructive)/0.1)] px-3 py-2 text-xs text-[hsl(var(--destructive))]">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
                            : 'Sign In'
                        }
                    </Button>
                </form>
            </div>
        </div>
    )
}
