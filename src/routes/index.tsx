import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { NetworthOverTimeChart } from '../components/NetworthOverTimeChart'
import ThemeToggle from '../components/ThemeToggle'
import { logout } from '../serverFns/auth'
import { getNetworthData } from '../serverFns/networth'
import {
  CATEGORIES,
  categoryTotalAtDate,
  formatCurrency,
  getAllDates,
  grossAssetsAtDate,
  liabilitiesTotalAtDate,
  mortgagesTotalAtDate,
  networthAtDate,
} from '../types/networth'

export const Route = createFileRoute('/')({
  component: Dashboard,
  loader: () => getNetworthData(),
})

function Dashboard() {
  const { assets, milestones = [] } = Route.useLoaderData()

  const dates = getAllDates(assets)
  const latestDate = dates.at(-1)!

  const totalNow = networthAtDate(assets, latestDate)
  const grossNow = grossAssetsAtDate(assets, latestDate)
  const mortgagesNow = mortgagesTotalAtDate(assets, latestDate)
  const adjustedGrossNow = grossNow - mortgagesNow
  const liabilitiesNow = liabilitiesTotalAtDate(assets, latestDate)

  const availableYears = [...new Set(dates.map((d) => parseInt(d.slice(0, 4))))].sort().filter((y) => {
    const hasPrev = dates.some((d) => d <= `${y - 1}-12-31`)
    const hasCurr = dates.some((d) => d <= `${y}-12-31`)
    return hasPrev && hasCurr
  })
  const [selectedYear, setSelectedYear] = useState(() => availableYears.at(-1) ?? new Date().getFullYear())
  const yearIdx = availableYears.indexOf(selectedYear)

  const endPrevYear = dates.filter((d) => d <= `${selectedYear - 1}-12-31`).at(-1)
  const endCurrYear = dates.filter((d) => d <= `${selectedYear}-12-31`).at(-1)
  const yoyCategories = (endPrevYear && endCurrYear)
    ? CATEGORIES.filter((c) => !c.liability).map((c) => {
        const mortgagesPrev = mortgagesTotalAtDate(assets, endPrevYear)
        const mortgagesCurr = mortgagesTotalAtDate(assets, endCurrYear)
        const grossPrev = categoryTotalAtDate(assets, c.id, endPrevYear)
        const grossCurr = categoryTotalAtDate(assets, c.id, endCurrYear)
        const valPrev = c.id === 'real_estate' ? Math.max(0, grossPrev - mortgagesPrev) : grossPrev
        const valCurr = c.id === 'real_estate' ? Math.max(0, grossCurr - mortgagesCurr) : grossCurr
        return { cat: c, valPrev, valCurr, growth: valCurr - valPrev }
      })
    : null

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <div className="rise-in mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="island-kicker mb-1">Personal Finance</p>
          <h1 className="display-title text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
            Net Worth
          </h1>
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
            Last updated:{' '}
            {new Date(latestDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 pt-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={async () => { await logout(); window.location.href = '/login' }}
            title="Sign out"
            className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Summary widget */}
      <section className="island-shell rise-in mb-8 rounded-2xl p-5" style={{ animationDelay: '60ms' }}>
        <div className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="pb-4 sm:pb-0 sm:pr-6">
            <p className="island-kicker mb-1">Total Assets</p>
            <p className="text-xl font-bold tracking-tight text-[var(--lagoon)]">{formatCurrency(grossNow)}</p>
          </div>
          <div className="py-4 sm:py-0 sm:px-6">
            <p className="island-kicker mb-1">Liabilities</p>
            <p className="text-xl font-bold tracking-tight" style={{ color: '#c0392b' }}>{formatCurrency(liabilitiesNow)}</p>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <p className="island-kicker mb-1">Net Worth</p>
            <p className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">{formatCurrency(totalNow)}</p>
          </div>
        </div>
      </section>

      {/* Category breakdown */}
      <div className="rise-in mb-6" style={{ animationDelay: '120ms' }}>
        <section className="island-shell rounded-2xl p-4 sm:p-6">
          <p className="island-kicker mb-0.5">Breakdown</p>
          <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Categories</h2>
          <div className="flex flex-col gap-3">
            {CATEGORIES.filter((c) => !c.liability).map((c) => {
              const gross = categoryTotalAtDate(assets, c.id, latestDate)
              const value = c.id === 'real_estate' ? Math.max(0, gross - mortgagesNow) : gross
              const pct = adjustedGrossNow > 0 ? (value / adjustedGrossNow) * 100 : 0
              return (
                <Link
                  key={c.id}
                  to="/category/$categoryId"
                  params={{ categoryId: c.id }}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4 no-underline transition hover:-translate-y-0.5 hover:border-[rgba(79,184,178,0.4)]"
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                    style={{ background: c.color }}
                  >
                    {c.label[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold text-[var(--sea-ink)]">
                        {c.label}{c.id === 'real_estate' ? ' (equity)' : ''}
                      </span>
                      <svg
                        className="flex-shrink-0 text-[var(--sea-ink-soft)] transition group-hover:translate-x-0.5"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="mt-0.5">
                      <span className="font-bold text-[var(--sea-ink)]">{formatCurrency(value)}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                      {pct.toFixed(1)}% of total
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      {/* Net worth over time */}
      <section className="island-shell rise-in mb-6 rounded-2xl p-6" style={{ animationDelay: '180ms' }}>
        <NetworthOverTimeChart assets={assets} milestones={milestones} />
      </section>

      {/* YoY growth */}
      {yoyCategories && (
        <section className="island-shell rise-in mb-6 rounded-2xl p-4 sm:p-6" style={{ animationDelay: '180ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="island-kicker mb-0.5">Year over Year</p>
              <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Growth in {selectedYear}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedYear(availableYears[yearIdx - 1])}
                disabled={yearIdx <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--sea-ink-soft)] transition hover:bg-[var(--surface)] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous year"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button
                type="button"
                onClick={() => setSelectedYear(availableYears[yearIdx + 1])}
                disabled={yearIdx >= availableYears.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--sea-ink-soft)] transition hover:bg-[var(--surface)] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next year"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-[var(--line)]">
            {yoyCategories.map(({ cat, valPrev, valCurr, growth }) => {
              const positive = growth >= 0
              const pctChange = valPrev !== 0 ? (growth / valPrev) * 100 : null
              const color = positive ? '#2f6a4a' : '#c0392b'
              return (
                <div key={cat.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: cat.color }} />
                      <span className="truncate text-sm font-semibold text-[var(--sea-ink)]">
                        {cat.label}{cat.id === 'real_estate' ? ' (equity)' : ''}
                      </span>
                    </span>
                    <span className="flex flex-shrink-0 items-baseline gap-2">
                      <span className="text-sm font-bold" style={{ color }}>{positive ? '+' : ''}{formatCurrency(growth)}</span>
                      {pctChange !== null && (
                        <span className="text-xs font-semibold" style={{ color }}>{positive ? '+' : ''}{pctChange.toFixed(1)}%</span>
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 pl-4 text-xs text-[var(--sea-ink-soft)]">
                    {formatCurrency(valPrev)} → {formatCurrency(valCurr)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </main>
  )
}
