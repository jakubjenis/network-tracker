import { useEffect, useRef } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Asset, Milestone } from '../types/networth'
import {
  formatCurrency,
  getAllDates,
  liabilitiesTotalAtDate,
  mortgagesTotalAtDate,
  networthAtDate,
} from '../types/networth'

interface Props {
  assets: Asset[]
  milestones?: Milestone[]
}

function toTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime()
}

function formatAxisDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

interface MilestoneLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number }
  value?: string
}

function MilestoneLabel({ viewBox, value }: MilestoneLabelProps) {
  if (!viewBox || !value) return null
  const { x, y } = viewBox
  const dotY = y + 8
  const textX = x + 3
  const textY = dotY + 6
  return (
    <g>
      <polygon
        points={`${x},${dotY - 4} ${x + 3},${dotY} ${x},${dotY + 4} ${x - 3},${dotY}`}
        fill="rgba(47,106,74,0.65)"
      />
      <text
        x={textX}
        y={textY}
        fontSize={9}
        fontWeight={600}
        fill="rgba(47,106,74,0.8)"
        textAnchor="start"
        transform={`rotate(-90, ${textX}, ${textY})`}
      >
        {value}
      </text>
    </g>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, assets }: { active?: boolean; payload?: ReadonlyArray<any>; label?: string | number; assets: Asset[] }) {
  if (!active || !payload?.length || label == null) return null
  const dateStr = payload[0]?.payload?.dateStr
  if (!dateStr) return null

  const date = new Date(Number(label)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const networth = networthAtDate(assets, dateStr)
  const liabilities = liabilitiesTotalAtDate(assets, dateStr)
  const mortgages = mortgagesTotalAtDate(assets, dateStr)

  return (
    <div style={{
      background: 'var(--surface-strong)',
      border: '1px solid rgba(23,58,64,0.12)',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
      minWidth: 180,
      boxShadow: '0 8px 24px rgba(23,58,64,0.12)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: 'var(--sea-ink)' }}>{date}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontWeight: 700, color: 'var(--sea-ink)' }}>
        <span>Net Worth</span>
        <span>{formatCurrency(networth)}</span>
      </div>
      {liabilities > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4, fontSize: 12, color: 'var(--sea-ink-soft)' }}>
          <span>Mortgages</span>
          <span>−{formatCurrency(mortgages)}</span>
        </div>
      )}
    </div>
  )
}

const CHART_HEIGHT = 260
const Y_AXIS_WIDTH = 44

export function NetworthOverTimeChart({ assets, milestones = [] }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const dates = getAllDates(assets)
  const data = dates.map((date) => ({
    ts: toTimestamp(date),
    dateStr: date,
    networth: networthAtDate(assets, date),
  }))

  const maxNetworth = Math.max(...data.map((d) => d.networth), 0)
  const yMax = Math.ceil((maxNetworth * 1.05) / 1_000_000) * 1_000_000
  const yDomain: [number, number] = [0, yMax]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [])

  const sharedYAxis = (
    <YAxis
      domain={yDomain}
      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
      tick={{ fontSize: 12, fill: '#416166' }}
      tickLine={false}
      axisLine={false}
      width={Y_AXIS_WIDTH}
    />
  )

  return (
    <div>
      <div className="mb-4">
        <p className="island-kicker mb-0.5">Over Time</p>
        <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Net Worth History</h2>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Scrollable chart — no y-axis */}
        <div
          ref={scrollRef}
          className="chart-scroll"
          style={{ overflowX: 'auto', paddingLeft: Y_AXIS_WIDTH }}
        >
          <div style={{ minWidth: 640 }}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad_networth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4fb8b2" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#4fb8b2" stopOpacity={0.04} />
                  </linearGradient>
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
                  tickCount={10}
                />
                <YAxis domain={yDomain} hide />
                <Tooltip content={(props) => <ChartTooltip {...props} assets={assets} />} />
                <Area
                  type="monotone"
                  dataKey="networth"
                  stroke="#4fb8b2"
                  strokeWidth={2}
                  fill="url(#grad_networth)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#4fb8b2', strokeWidth: 0 }}
                />
                {milestones.map((m) => (
                  <ReferenceLine
                    key={m.date}
                    x={toTimestamp(m.date)}
                    stroke="rgba(47,106,74,0.35)"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    label={(props) => <MilestoneLabel {...props} value={m.label} />}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sticky y-axis overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: Y_AXIS_WIDTH + 8,
            height: CHART_HEIGHT,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, var(--surface-strong) 72%, transparent)',
          }}
        >
          <ResponsiveContainer width={Y_AXIS_WIDTH + 8} height={CHART_HEIGHT}>
            <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              {sharedYAxis}
              <XAxis dataKey="ts" type="number" hide />
              <Area dataKey="networth" stroke="none" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
