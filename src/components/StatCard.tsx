import { formatCurrency } from '../types/networth'

interface Props {
  label: string
  value: number
  delta?: number
  accent?: string
}

export function StatCard({ label, value, delta, accent = '#4fb8b2' }: Props) {
  const positive = delta !== undefined && delta >= 0

  return (
    <div className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-2">{label}</p>
      <p
        className="text-2xl font-bold tracking-tight"
        style={{ color: accent }}
      >
        {formatCurrency(value)}
      </p>
      {delta !== undefined && (
        <p
          className="mt-1 text-sm font-medium"
          style={{ color: positive ? '#2f6a4a' : '#c0392b' }}
        >
          {positive ? '▲' : '▼'} {formatCurrency(Math.abs(delta))} vs previous
        </p>
      )}
    </div>
  )
}
