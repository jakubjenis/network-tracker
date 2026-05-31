import { Link, createFileRoute } from '@tanstack/react-router'
import { AssetLineChart } from '../components/AssetLineChart'
import { StatCard } from '../components/StatCard'
import { getNetworthData } from '../serverFns/networth'
import {
  type CategoryId,
  CATEGORIES,
  categoryTotalAtDate,
  formatCurrency,
  formatDate,
  getAssetsForCategory,
  getAllDates,
  getCategoryMeta,
  getLatestDate,
  getLatestValue,
} from '../types/networth'

export const Route = createFileRoute('/category/$categoryId')({
  component: CategoryDetail,
  loader: () => getNetworthData(),
})

function CategoryDetail() {
  const { assets } = Route.useLoaderData()
  const { categoryId } = Route.useParams()

  const meta = getCategoryMeta(categoryId as CategoryId)
  const categoryAssets = getAssetsForCategory(assets, categoryId as CategoryId)
  const latestDate = getLatestDate(assets)
  const prevDate = getAllDates(assets).at(-2)

  const totalNow = categoryTotalAtDate(assets, categoryId as CategoryId, latestDate)
  const totalPrev = prevDate
    ? categoryTotalAtDate(assets, categoryId as CategoryId, prevDate)
    : undefined
  const delta = totalPrev !== undefined ? totalNow - totalPrev : undefined

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <Link
        to="/"
        className="rise-in mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Dashboard
      </Link>

      <div className="rise-in mb-8">
        <p className="island-kicker mb-1" style={{ color: meta.color }}>
          {meta.liquid ? 'Liquid Asset' : 'Non-Liquid Asset'}
        </p>
        <h1 className="display-title text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          {meta.label}
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

      {/* Summary */}
      <section className="rise-in mb-8 grid gap-4 sm:grid-cols-3" style={{ animationDelay: '60ms' }}>
        <StatCard label={`Total ${meta.label}`} value={totalNow} delta={delta} accent={meta.color} />
        <div className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-2">Assets Tracked</p>
          <p className="text-2xl font-bold tracking-tight" style={{ color: meta.color }}>
            {categoryAssets.length}
          </p>
        </div>
        <div className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-2">Data Points</p>
          <p className="text-2xl font-bold tracking-tight" style={{ color: meta.color }}>
            {categoryAssets.reduce((sum, a) => sum + a.values.length, 0)}
          </p>
        </div>
      </section>

      {/* Charts */}
      <div className="rise-in grid gap-6 md:grid-cols-2" style={{ animationDelay: '120ms' }}>
        <section className="island-shell rounded-2xl p-6">
          <p className="island-kicker mb-0.5">Over Time</p>
          <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Individual Assets</h2>
          <AssetLineChart assets={assets} categoryId={categoryId as CategoryId} />
        </section>

        <section className="island-shell rounded-2xl p-6">
          <p className="island-kicker mb-0.5">Current Values</p>
          <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Latest Snapshot</h2>
          <div className="flex flex-col gap-3">
            {categoryAssets.map((asset, i) => {
              const value = getLatestValue(asset)
              const pct = totalNow > 0 ? (value / totalNow) * 100 : 0
              const assetDates = asset.values.map((v) => v.date).sort()
              const assetPrev = assetDates.at(-2)
              const assetDelta = assetPrev
                ? value - getLatestValue(asset, assetPrev)
                : undefined

              return (
                <div
                  key={asset.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{
                        background: ['#4fb8b2','#328f97','#2f6a4a','#7bcfc7','#1b5e6e','#5ba87a'][i % 6],
                      }}
                    />
                    <span className="flex-1 font-medium text-[var(--sea-ink)]">{asset.label}</span>
                    <span className="font-bold" style={{ color: meta.color }}>
                      {formatCurrency(value)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: meta.color }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-[var(--sea-ink-soft)]">
                    <span>{pct.toFixed(1)}% of category</span>
                    {assetDelta !== undefined && (
                      <span style={{ color: assetDelta >= 0 ? '#2f6a4a' : '#c0392b' }}>
                        {assetDelta >= 0 ? '+' : ''}{formatCurrency(assetDelta)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Per-asset history tables */}
      {categoryAssets.map((asset) => (
        <section
          key={asset.id}
          className="island-shell rise-in mt-6 rounded-2xl p-6"
          style={{ animationDelay: '180ms' }}
        >
          <p className="island-kicker mb-0.5">{asset.label}</p>
          <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Value History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="pb-2 text-left font-semibold text-[var(--sea-ink-soft)]">Date</th>
                  <th className="pb-2 text-right font-semibold text-[var(--sea-ink-soft)]">Value</th>
                  <th className="pb-2 text-right font-semibold text-[var(--sea-ink-soft)]">Change</th>
                </tr>
              </thead>
              <tbody>
                {[...asset.values].reverse().map((entry, i, arr) => {
                  const prev = arr[i + 1]
                  const change = prev ? entry.value - prev.value : undefined
                  return (
                    <tr key={entry.date} className="border-b border-[var(--line)] last:border-0">
                      <td className="py-2.5 text-[var(--sea-ink-soft)]">{formatDate(entry.date)}</td>
                      <td className="py-2.5 text-right font-medium text-[var(--sea-ink)]">
                        {formatCurrency(entry.value)}
                      </td>
                      <td className="py-2.5 text-right text-xs">
                        {change !== undefined ? (
                          <span style={{ color: change >= 0 ? '#2f6a4a' : '#c0392b' }}>
                            {change >= 0 ? '+' : ''}{formatCurrency(change)}
                          </span>
                        ) : (
                          <span className="text-[var(--sea-ink-soft)]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Category nav */}
      <section className="rise-in mt-6 flex flex-wrap gap-2" style={{ animationDelay: '240ms' }}>
        {CATEGORIES.filter((c) => c.id !== categoryId).map((c) => (
          <Link
            key={c.id}
            to="/category/$categoryId"
            params={{ categoryId: c.id }}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(79,184,178,0.4)] hover:text-[var(--sea-ink)]"
          >
            {c.label}
          </Link>
        ))}
      </section>
    </main>
  )
}
