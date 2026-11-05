'use client'

import { CalendarDays, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'

type SearchResult = {
  id: string
  customer_name: string
  customer_email: string
  starts_at: string
  status: string
  service: { name: string } | null
}

export function DashboardSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        })
        const payload = await response.json() as { results?: SearchResult[] }
        setResults(payload.results ?? [])
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function openResults() {
    const value = query.trim()
    if (!value) return
    setOpen(false)
    router.push(`/bookings?q=${encodeURIComponent(value)}`)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    openResults()
  }

  return (
    <div className="relative w-56 lg:w-72">
      <form onSubmit={submit} role="search" className="relative">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          aria-label="Search appointments"
          autoComplete="off"
          placeholder="Search appointments"
          className="h-8 w-full rounded-lg border-0 bg-secondary pl-9 pr-11 text-xs text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-10 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-popover shadow-xl ring-1 ring-foreground/10">
          <div className="border-b px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </div>
          {!loading && results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matching appointments.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/bookings?q=${encodeURIComponent(result.customer_name)}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 hover:bg-secondary"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                    <CalendarDays className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{result.customer_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{result.service?.name ?? 'Service unavailable'} · {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(result.starts_at))}</span>
                  </span>
                  <span className="text-[10px] capitalize text-muted-foreground">{result.status.replaceAll('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={openResults} className="w-full border-t px-3 py-2.5 text-left text-xs font-medium text-accent hover:bg-secondary">
            View all results for “{query.trim()}”
          </button>
        </div>
      )}
    </div>
  )
}
