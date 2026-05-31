import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Asset } from '../types/networth'
import {
  CATEGORIES,
  categoryTotalAtDate,
  formatCurrency,
  getLatestDate,
} from '../types/networth'

interface Props {
  assets: Asset[]
  asOf?: string
}

export function CategoryPieChart({ assets, asOf }: Props) {
  const date = asOf ?? getLatestDate(assets)

  const data = CATEGORIES.filter((c) => !c.liability).map((c) => ({
    name: c.label,
    value: categoryTotalAtDate(assets, c.id, date),
    color: c.color,
  })).filter((d) => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => [formatCurrency(Number(v ?? 0)), String(name)]}
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(23,58,64,0.12)', fontSize: 13 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
