import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Asset, CategoryId } from '../types/networth'
import { formatCurrency, formatDate, getAssetsForCategory, getAllDates, getLatestValue } from '../types/networth'

const ASSET_COLORS = [
  '#4fb8b2',
  '#328f97',
  '#2f6a4a',
  '#7bcfc7',
  '#1b5e6e',
  '#5ba87a',
]

interface Props {
  assets: Asset[]
  categoryId: CategoryId
}

export function AssetLineChart({ assets, categoryId }: Props) {
  const categoryAssets = getAssetsForCategory(assets, categoryId)
  const dates = getAllDates(categoryAssets)

  const data = dates.map((date) => {
    const row: Record<string, string | number> = { date: formatDate(date) }
    for (const asset of categoryAssets) {
      row[asset.id] = getLatestValue(asset, date)
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,58,64,0.08)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#416166' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: '#416166' }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(v, id) => [
            formatCurrency(Number(v ?? 0)),
            categoryAssets.find((a) => a.id === String(id))?.label ?? String(id),
          ]}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid rgba(23,58,64,0.12)',
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(id) =>
            categoryAssets.find((a) => a.id === id)?.label ?? id
          }
          wrapperStyle={{ fontSize: 13 }}
        />
        {categoryAssets.map((asset, i) => (
          <Line
            key={asset.id}
            type="monotone"
            dataKey={asset.id}
            stroke={ASSET_COLORS[i % ASSET_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
