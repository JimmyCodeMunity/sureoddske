import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Trash2, FileText, Loader2, CheckCircle2, TrendingUp, Target, Trophy, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBetSlip } from '@/context/BetSlipContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// KES 100 per 5 games (in cents)
const PRICE_PER_5 = 10000
const GAMES_PER_SET = 5

function calcPrice(count) {
    if (!count) return 0
    return Math.ceil(count / GAMES_PER_SET) * PRICE_PER_5
}
function fmtKes(cents) { return `KES ${(cents / 100).toFixed(0)}` }

function isValidPhone(p) {
    return /^(\+?254|0)[7|1][0-9]{8}$/.test(p.replace(/\s/g, ''))
}

function formatMatch(bet) { return `${bet.home_team} vs ${bet.away_team}` }
function formatKickoff(str) {
    const d = new Date(str)
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfBar({ value }) {
    const color = value >= 65 ? 'bg-[hsl(var(--primary))]'
        : value >= 45 ? 'bg-yellow-500'
            : 'bg-[hsl(var(--muted-foreground))]'
    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700', color)}
                    style={{ width: `${value}%` }} />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-[hsl(var(--muted-foreground))]">{value}%</span>
        </div>
    )
}

// ── Prediction card ───────────────────────────────────────────────────────────
function PredCard({ p, tab }) {
    const pred = tab === 'h2h' ? p.h2h : p.gg
    if (!pred) return null
    return (
        <li className="px-4 py-4 space-y-2 border-b border-[hsl(var(--border))] last:border-0">
            <p className="text-xs font-bold text-[hsl(var(--foreground))] leading-snug">{p.match}</p>
            {p.league && <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{p.league}</p>}
            <div className="flex items-center gap-2 flex-wrap">
                <Target className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                <span className="rounded-full bg-[hsl(var(--primary))] text-white px-3 py-0.5 text-[11px] font-bold">
                    {pred.tip}
                </span>
            </div>
            <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Confidence</p>
                <ConfBar value={pred.confidence} />
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] italic leading-relaxed">{pred.reasoning}</p>
        </li>
    )
}

// ── Paystack hook ─────────────────────────────────────────────────────────────
function usePaystack() {
    const loaded = useRef(false)
    useEffect(() => {
        if (loaded.current || document.querySelector('script[src*="paystack"]')) {
            loaded.current = true; return
        }
        const s = document.createElement('script')
        s.src = 'https://js.paystack.co/v1/inline.js'
        s.async = true
        s.onload = () => { loaded.current = true }
        document.head.appendChild(s)
    }, [])

    const pay = useCallback(({ email, amount, accessCode, reference, onSuccess, onClose }) => {
        if (!window.PaystackPop) throw new Error('Paystack is loading — please try again.')
        window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email,
            amount,
            currency: 'KES',
            access_code: accessCode,
            ref: reference,
            onClose,
            callback: (r) => onSuccess(r.reference),
        }).openIframe()
    }, [])

    return { pay }
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export default function BetSlipDrawer() {
    const { slip, removeBet, clearSlip, open, setOpen } = useBetSlip()
    const { pay } = usePaystack()

    const [phone, setPhone] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [step, setStep] = useState('idle')  // idle|paying|verifying|success|error
    const [errMsg, setErrMsg] = useState('')
    const [predictions, setPredictions] = useState([])
    const [predTab, setPredTab] = useState('h2h')   // h2h | gg

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape' && open) setOpen(false) }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [open, setOpen])

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    const amount = calcPrice(slip.length)
    const hasGGPreds = predictions.some((p) => p.gg)

    async function handlePay() {
        if (!isValidPhone(phone)) {
            setPhoneError('Enter a valid Kenyan number e.g. 0712345678')
            return
        }
        setPhoneError('')
        setStep('paying')
        setErrMsg('')

        try {
            // 1. Init
            const initRes = await fetch('/api/payment/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    games: slip.map((b) => ({
                        game_id: b.game_id,
                        match: `${b.home_team} vs ${b.away_team}`,
                        home_team: b.home_team,
                        away_team: b.away_team,
                        league: b.league || '',
                        odds: { home: b.odds?.home ?? null, draw: b.odds?.draw ?? null, away: b.odds?.away ?? null },
                        gg: { yes: b.gg?.yes ?? null, no: b.gg?.no ?? null },
                    })),
                }),
            })
            const initData = await initRes.json()
            if (!initRes.ok) throw new Error(initData.error || 'Could not initialise payment')

            // 2. Paystack popup
            const digits = phone.replace(/\D/g, '')
            const email = `${digits}@oddshub.pay`

            pay({
                email,
                amount: initData.amount || amount,
                accessCode: initData.access_code,
                reference: initData.reference,
                onSuccess: async (ref) => {
                    setStep('verifying')   // show "Verifying odds…" loader
                    try {
                        const vRes = await fetch(`/api/payment/verify/${ref}`)
                        const vData = await vRes.json()
                        if (vData.status === 'success') {
                            setPredictions(vData.predictions || [])
                            setPredTab('h2h')
                            setStep('success')
                            clearSlip()
                        } else {
                            setStep('error')
                            setErrMsg(`Payment status: ${vData.status || 'unknown'}. Contact support.`)
                        }
                    } catch (e) {
                        setStep('error')
                        setErrMsg(`Verification error: ${e.message}`)
                    }
                },
                onClose: () => setStep((p) => (p === 'paying' ? 'idle' : p)),
            })
        } catch (err) {
            setStep('error')
            setErrMsg(err.message)
        }
    }

    function handleDone() {
        setStep('idle'); setPhone(''); setErrMsg(''); setPredictions([]); setOpen(false)
    }

    // ── FAB ──────────────────────────────────────────────────────────────────
    const fab = (
        <button
            onClick={() => setOpen(true)}
            aria-label={`Open prediction slip${slip.length ? ` — ${slip.length} games` : ''}`}
            className={cn(
                'fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40',
                'flex items-center gap-2 rounded-full shadow-xl px-4 py-3',
                'bg-[hsl(var(--primary))] text-white transition-all duration-200',
                'hover:brightness-110 active:scale-95',
                open && 'opacity-0 pointer-events-none scale-90'
            )}
        >
            <FileText className="h-5 w-5 shrink-0" />
            {slip.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white text-[hsl(var(--primary))] text-[11px] font-bold px-1">
                    {slip.length}
                </span>
            )}
            <span className="text-sm font-semibold hidden sm:inline">Prediction Slip</span>
        </button>
    )

    return (
        <>
            {fab}

            {/* Backdrop */}
            <div onClick={() => setOpen(false)} aria-hidden="true"
                className={cn(
                    'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )} />

            {/* Drawer */}
            <div role="dialog" aria-label="Prediction Slip" aria-modal="true"
                className={cn(
                    'fixed right-0 top-0 bottom-0 z-50 flex flex-col',
                    'w-full sm:max-w-[400px]',
                    'bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] shadow-2xl',
                    'transition-transform duration-300 ease-in-out',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(var(--border))] shrink-0">
                    <div className="flex items-center gap-2">
                        {step === 'success' ? <Trophy className="h-4 w-4 text-yellow-500" />
                            : <FileText className="h-4 w-4 text-[hsl(var(--primary))]" />}
                        <h2 className="font-semibold text-sm">
                            {step === 'success' ? 'Your Predictions' : 'Prediction Slip'}
                        </h2>
                        {slip.length > 0 && step !== 'success' && (
                            <span className="rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                {slip.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5">
                        {slip.length > 0 && !['success', 'verifying'].includes(step) && (
                            <button onClick={clearSlip}
                                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors">
                                <Trash2 className="h-3.5 w-3.5" /> Clear
                            </button>
                        )}
                        <button onClick={() => setOpen(false)}
                            className="ml-1 p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                            aria-label="Close">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain">

                    {/* VERIFYING LOADER */}
                    {step === 'verifying' && (
                        <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center py-16">
                            <div className="relative flex h-16 w-16 items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-[hsl(var(--primary)/0.2)]" />
                                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="font-bold text-base">Verifying odds…</p>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    Analysing market data and generating your predictions.
                                </p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] animate-pulse">
                                    Please wait, this takes a few seconds.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS — predictions */}
                    {step === 'success' && (
                        <div>
                            {/* Banner */}
                            <div className="flex flex-col items-center gap-2 px-6 py-5 border-b border-[hsl(var(--border))] text-center bg-[hsl(var(--primary)/0.05)]">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.12)]">
                                    <CheckCircle2 className="h-7 w-7 text-[hsl(var(--primary))]" />
                                </div>
                                <p className="font-bold text-base">Payment Confirmed!</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">Your AI predictions are ready</p>
                            </div>

                            {/* Prediction type tabs */}
                            {predictions.length > 0 && (
                                <>
                                    <div className="flex border-b border-[hsl(var(--border))] shrink-0">
                                        {[
                                            { id: 'h2h', label: '1X2 Predictions' },
                                            ...(hasGGPreds ? [{ id: 'gg', label: 'GG Predictions' }] : []),
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setPredTab(t.id)}
                                                className={cn(
                                                    'flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2',
                                                    predTab === t.id
                                                        ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                                                        : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                                )}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <ul>
                                        {predictions.map((p, i) => (
                                            <PredCard key={i} p={p} tab={predTab} />
                                        ))}
                                    </ul>
                                </>
                            )}

                            {!predictions.length && (
                                <p className="px-6 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                    No predictions generated. Please contact support.
                                </p>
                            )}

                            <div className="px-4 py-4 border-t border-[hsl(var(--border))] space-y-3 sticky bottom-0 bg-[hsl(var(--card))]">
                                <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
                                    For entertainment only. Please gamble responsibly.
                                </p>
                                <Button onClick={handleDone} className="w-full">Close</Button>
                            </div>
                        </div>
                    )}

                    {/* EMPTY */}
                    {!['verifying', 'success'].includes(step) && slip.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center py-16">
                            <FileText className="h-12 w-12 text-[hsl(var(--muted-foreground))] opacity-30" />
                            <p className="font-medium">Your slip is empty</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Click any game card to add it here.
                            </p>
                        </div>
                    )}

                    {/* GAME LIST */}
                    {!['verifying', 'success'].includes(step) && slip.length > 0 && (
                        <ul className="divide-y divide-[hsl(var(--border))]">
                            {slip.map((bet) => (
                                <li key={bet.game_id} className="flex items-start gap-3 px-4 py-3.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-snug">{formatMatch(bet)}</p>
                                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{formatKickoff(bet.commence_time)}</p>
                                        {bet.league && (
                                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate opacity-70">{bet.league}</p>
                                        )}
                                        {/* Odds reference */}
                                        <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] font-mono">
                                            {bet.odds?.home && <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5">1 {Number(bet.odds.home).toFixed(2)}</span>}
                                            {bet.odds?.draw && <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5">X {Number(bet.odds.draw).toFixed(2)}</span>}
                                            {bet.odds?.away && <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5">2 {Number(bet.odds.away).toFixed(2)}</span>}
                                            {bet.gg?.yes && <span className="rounded bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] px-1.5 py-0.5">GG {Number(bet.gg.yes).toFixed(2)}</span>}
                                            {bet.gg?.no && <span className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5">NG {Number(bet.gg.no).toFixed(2)}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => removeBet(bet.game_id)}
                                        className="shrink-0 mt-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors p-1"
                                        aria-label={`Remove ${formatMatch(bet)}`}>
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                {slip.length > 0 && !['verifying', 'success'].includes(step) && (
                    <div className="border-t border-[hsl(var(--border))] px-4 pt-3 pb-5 space-y-3 shrink-0">

                        {/* Pricing summary */}
                        <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--primary)/0.07)] px-3 py-2.5">
                            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                                <span>{slip.length} game{slip.length !== 1 ? 's' : ''}</span>
                                <span className="opacity-50">·</span>
                                <span>{Math.ceil(slip.length / GAMES_PER_SET)} bracket{Math.ceil(slip.length / GAMES_PER_SET) !== 1 ? 's' : ''}</span>
                            </div>
                            <span className="text-sm font-bold text-[hsl(var(--foreground))]">{fmtKes(amount)}</span>
                        </div>

                        {/* Pricing hint */}
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] px-1">
                            KES 100 per 5 games. Adding game {GAMES_PER_SET * Math.ceil(slip.length / GAMES_PER_SET) + 1} stays at {fmtKes(amount)}.
                        </p>

                        {/* Phone input */}
                        <div className="space-y-1.5">
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                                <Input
                                    type="tel"
                                    placeholder="Phone number e.g. 0712345678"
                                    value={phone}
                                    onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                                    className="h-10 text-sm pl-9"
                                    disabled={step === 'paying'}
                                    autoComplete="tel"
                                />
                            </div>
                            {phoneError && (
                                <p className="text-[11px] text-[hsl(var(--destructive))] px-1">{phoneError}</p>
                            )}
                        </div>

                        {/* Error */}
                        {step === 'error' && (
                            <div className="rounded-md bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.2)] px-3 py-2 text-xs text-[hsl(var(--destructive))]">
                                {errMsg}
                            </div>
                        )}

                        {/* CTA */}
                        <Button className="w-full h-11 gap-2 text-sm font-semibold" onClick={handlePay} disabled={step === 'paying'}>
                            {step === 'paying'
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</>
                                : <><Target className="h-4 w-4" /> Get Predictions · {fmtKes(amount)}</>}
                        </Button>

                        <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
                            Secured by Paystack · M-Pesa &amp; Card accepted
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}
