import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Asset } from '../types/networth'
import {
  CATEGORIES,
  categoryTotalAtDate,
  formatCurrency,
  getAllDates,
  getAssetsForCategory,
  getLatestValue,
  liabilitiesTotalAtDate,
  mortgagesTotalAtDate,
} from '../types/networth'

interface Props {
  assets: Asset[]
}

function toTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime()
}

function formatAxisDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

interface TooltipProps {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: ReadonlyArray<any>
  label?: string | number
  assets: Asset[]
  showLiabilities: boolean
}

function ChartTooltip({ active, payload, label, assets, showLiabilities }: TooltipProps) {
  if (!active || !payload?.length || label == null) return null

  const dateStr = payload[0]?.payload?.dateStr
  if (!dateStr) return null

  const date = new Date(Number(label)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const nonLiab = CATEGORIES.filter((c) => !c.liability)
  const liabTotal = liabilitiesTotalAtDate(assets, dateStr)
  const mortgagesTotal = mortgagesTotalAtDate(assets, dateStr)
  const gross = nonLiab.reduce((s, c) => s + categoryTotalAtDate(assets, c.id, dateStr), 0)
  const net = gross - liabTotal

  return (
    <div
      style={{
        background: 'var(--surface-strong)',
        border: '1px solid rgba(23,58,64,0.12)',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 13,
        minWidth: 230,
        boxShadow: '0 8px 24px rgba(23,58,64,0.12)',
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 10, color: 'var(--sea-ink)' }}>{date}</p>

      {/* Assets by category */}
      {[...nonLiab].reverse().map((cat) => {
        const gross = categoryTotalAtDate(assets, cat.id, dateStr)
        if (gross === 0) return null

        const isRealEstate = cat.id === 'real_estate'
        const displayTotal = isRealEstate && !showLiabilities
          ? Math.max(0, gross - mortgagesTotal)
          : gross

        const items = getAssetsForCategory(assets, cat.id)
          .map((a) => ({ label: a.label, value: getLatestValue(a, dateStr) }))
          .filter((a) => a.value > 0)

        const showMortgageRow = isRealEstate && !showLiabilities && mortgagesTotal > 0

        return (
          <div key={cat.id} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                fontWeight: 600,
                color: cat.color,
                marginBottom: (items.length > 1 || showMortgageRow) ? 3 : 0,
              }}
            >
              <span>{cat.label}{isRealEstate && !showLiabilities ? ' (equity)' : ''}</span>
              <span>{formatCurrency(displayTotal)}</span>
            </div>
            {items.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingLeft: 10,
                  color: 'var(--sea-ink-soft)',
                  fontSize: 12,
                }}
              >
                <span>{item.label}</span>
                <span>{formatCurrency(item.value)}</span>
              </div>
            ))}
            {showMortgageRow && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingLeft: 10,
                  color: '#c0392b',
                  fontSize: 12,
                }}
              >
                <span>Mortgages</span>
                <span>−{formatCurrency(mortgagesTotal)}</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Liabilities */}
      {showLiabilities && liabTotal > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              fontWeight: 600,
              color: '#c0392b',
              marginBottom: 3,
            }}
          >
            <span>Liabilities</span>
            <span>−{formatCurrency(liabTotal)}</span>
          </div>
          {getAssetsForCategory(assets, 'liabilities')
            .map((a) => ({ label: a.label, value: getLatestValue(a, dateStr) }))
            .filter((a) => a.value > 0)
            .map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingLeft: 10,
                  color: 'var(--sea-ink-soft)',
                  fontSize: 12,
                }}
              >
                <span>{item.label}</span>
                <span>−{formatCurrency(item.value)}</span>
              </div>
            ))}
        </div>
      )}

      {/* Net worth total */}
      <div
        style={{
          borderTop: '1px solid rgba(23,58,64,0.1)',
          marginTop: 4,
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          fontWeight: 700,
          color: 'var(--sea-ink)',
        }}
      >
        <span>Net Worth</span>
        <span>{formatCurrency(net)}</span>
      </div>
    </div>
  )
}

export function NetworthOverTimeChart({ assets }: Props) {
  const [showLiabilities, setShowLiabilities] = useState(false)

  const dates = getAllDates(assets)
  const nonLiab = CATEGORIES.filter((c) => !c.liability)

  const data = dates.map((date) => {
    const mortgages = mortgagesTotalAtDate(assets, date)
    return {
      ts: toTimestamp(date),
      dateStr: date,
      ...Object.fromEntries(
        nonLiab.map((c) => {
          const total = categoryTotalAtDate(assets, c.id, date)
          // When liabilities are hidden, net real estate against mortgages
          const value = c.id === 'real_estate' && !showLiabilities
            ? Math.max(0, total - mortgages)
            : total
          return [c.id, value]
        })
      ),
      liabilities: liabilitiesTotalAtDate(assets, date),
    }
  })

  // Render largest categories at the bottom of the stack
  const stackOrder = [...nonLiab].reverse()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="island-kicker mb-0.5">Over Time</p>
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Net Worth History</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowLiabilities((v) => !v)}
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
          style={{
            borderColor: showLiabilities ? '#c0392b' : 'var(--line)',
            background: showLiabilities ? 'rgba(192,57,43,0.08)' : 'var(--surface)',
            color: showLiabilities ? '#c0392b' : 'var(--sea-ink-soft)',
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: showLiabilities ? '#c0392b' : 'var(--line)' }}
          />
          Liabilities
        </button>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            {nonLiab.map((cat) => (
              <linearGradient key={cat.id} id={`grad_${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cat.color} stopOpacity={0.55} />
                <stop offset="95%" stopColor={cat.color} stopOpacity={0.12} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,58,64,0.08)" />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 11, fill: '#416166' }}
            tickLine={false}
            axisLine={false}
            tickCount={8}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            tick={{ fontSize: 12, fill: '#416166' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                {...props}
                assets={assets}
                showLiabilities={showLiabilities}
              />
            )}
          />
          {stackOrder.map((cat) => (
            <Area
              key={cat.id}
              type="monotone"
              dataKey={cat.id}
              stackId="assets"
              stroke={cat.color}
              strokeWidth={1}
              fill={`url(#grad_${cat.id})`}
              name={cat.label}
              dot={false}
              activeDot={false}
            />
          ))}
          {showLiabilities && (
            <Area
              type="monotone"
              dataKey="liabilities"
              stroke="#c0392b"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="rgba(192,57,43,0.05)"
              name="Liabilities"
              dot={false}
              activeDot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--sea-ink-soft)]">
        {stackOrder.map((cat) => (
          <span key={cat.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: cat.color }} />
            {cat.label}
          </span>
        ))}
        {showLiabilities && (
          <span className="flex items-center gap-1.5" style={{ color: '#c0392b' }}>
            <span className="h-2 w-2 rounded-sm" style={{ background: '#c0392b' }} />
            Liabilities
          </span>
        )}
      </div>
    </div>
  )
}
