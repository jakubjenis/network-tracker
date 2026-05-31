import { Link, createFileRoute } from '@tanstack/react-router'
import { CategoryPieChart } from '../components/CategoryPieChart'
import { NetworthOverTimeChart } from '../components/NetworthOverTimeChart'
import { StatCard } from '../components/StatCard'
import { getNetworthData } from '../serverFns/networth'
import {
  CATEGORIES,
  categoryTotalAtDate,
  formatCurrency,
  getAllDates,
  liabilitiesTotalAtDate,
  liquidTotalAtDate,
  networthAtDate,
  nonLiquidTotalAtDate,
} from '../types/networth'

export const Route = createFileRoute('/')({
  component: Dashboard,
  loader: () => getNetworthData(),
})

function Dashboard() {
  const { assets } = Route.useLoaderData()

  const dates = getAllDates(assets)
  const latestDate = dates.at(-1)!
  const prevDate = dates.at(-2)

  const totalNow = networthAtDate(assets, latestDate)
  const liquidNow = liquidTotalAtDate(assets, latestDate)
  const nonLiquidNow = nonLiquidTotalAtDate(assets, latestDate)

  const liabilitiesNow = liabilitiesTotalAtDate(assets, latestDate)
  const liabilitiesDelta = prevDate ? liabilitiesNow - liabilitiesTotalAtDate(assets, prevDate) : undefined

  const totalDelta = prevDate ? totalNow - networthAtDate(assets, prevDate) : undefined
  const liquidDelta = prevDate ? liquidNow - liquidTotalAtDate(assets, prevDate) : undefined
  const nonLiquidDelta = prevDate ? nonLiquidNow - nonLiquidTotalAtDate(assets, prevDate) : undefined

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <div className="rise-in mb-8">
        <p className="island-kicker mb-1">Personal Finance</p>
        <h1 className="display-title text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Net Worth Dashboard
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

      {/* Summary cards */}
      <section className="rise-in mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: '60ms' }}>
        <StatCard label="Total Net Worth" value={totalNow} delta={totalDelta} accent="#4fb8b2" />
        <StatCard label="Liquid Assets" value={liquidNow} delta={liquidDelta} accent="#328f97" />
        <StatCard label="Non-Liquid Assets" value={nonLiquidNow} delta={nonLiquidDelta} accent="#2f6a4a" />
        <StatCard label="Liabilities" value={-liabilitiesNow} delta={liabilitiesDelta !== undefined ? -liabilitiesDelta : undefined} accent="#c0392b" />
      </section>

      {/* Net worth over time */}
      <section className="island-shell rise-in mb-6 rounded-2xl p-6" style={{ animationDelay: '120ms' }}>
        <NetworthOverTimeChart assets={assets} />
      </section>

      {/* Category breakdown */}
      <div className="rise-in grid gap-6 md:grid-cols-2" style={{ animationDelay: '180ms' }}>
        {/* Pie chart */}
        <section className="island-shell rounded-2xl p-6">
          <p className="island-kicker mb-0.5">Current Snapshot</p>
          <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Allocation by Category</h2>
          <CategoryPieChart assets={assets} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: c.color }} />
                <span>{c.label}</span>
                <span className="ml-auto font-medium text-[var(--sea-ink)]">
                  {formatCurrency(categoryTotalAtDate(assets, c.id, latestDate))}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Category links */}
        <section className="island-shell rounded-2xl p-6">
          <p className="island-kicker mb-0.5">Breakdown</p>
          <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Categories</h2>
          <div className="flex flex-col gap-3">
            {CATEGORIES.map((c) => {
              const value = categoryTotalAtDate(assets, c.id, latestDate)
              const pct = totalNow > 0 ? (value / totalNow) * 100 : 0
              const prevValue = prevDate ? categoryTotalAtDate(assets, c.id, prevDate) : undefined
              const delta = prevValue !== undefined ? value - prevValue : undefined

              return (
                <Link
                  key={c.id}
                  to="/category/$categoryId"
                  params={{ categoryId: c.id }}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 no-underline transition hover:-translate-y-0.5 hover:border-[rgba(79,184,178,0.4)]"
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                    style={{ background: c.color }}
                  >
                    {c.label[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-[var(--sea-ink)]">{c.label}</span>
                      <span className="font-bold text-[var(--sea-ink)]">{formatCurrency(value)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-[var(--sea-ink-soft)]">
                      <span>{pct.toFixed(1)}% of total</span>
                      {delta !== undefined && (
                        <span style={{ color: delta >= 0 ? '#2f6a4a' : '#c0392b' }}>
                          {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="flex-shrink-0 text-[var(--sea-ink-soft)] transition group-hover:translate-x-0.5"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
