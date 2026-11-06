import Link from 'next/link'

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 font-body text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <Link href="/" className="text-xl font-semibold tracking-tight">✦ Slotly</Link>
          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </nav>
        <header className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">The small print</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
        </header>
        <div className="space-y-9 pb-16 text-sm leading-7 text-foreground/85 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </main>
  )
}
