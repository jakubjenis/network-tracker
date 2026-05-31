export type CategoryId = 'cash' | 'investments' | 'vehicles' | 'real_estate' | 'liabilities'

export interface AssetValue {
  date: string
  value: number
}

export type AssetType = 'mortgage' | 'default'

export interface Asset {
  id: string
  label: string
  category: CategoryId
  type?: AssetType
  values: AssetValue[]
}

export interface Milestone {
  date: string
  label: string
}

export interface NetworthData {
  assets: Asset[]
  milestones?: Milestone[]
}

export interface CategoryMeta {
  id: CategoryId
  label: string
  liquid: boolean
  liability: boolean
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'cash',        label: 'Cash',        liquid: true,  liability: false, color: '#4fb8b2' },
  { id: 'investments', label: 'Investments', liquid: true,  liability: false, color: '#328f97' },
  { id: 'vehicles',    label: 'Vehicles',    liquid: true,  liability: false, color: '#7bcfc7' },
  { id: 'real_estate', label: 'Real Estate', liquid: false, liability: false, color: '#2f6a4a' },
  { id: 'liabilities', label: 'Liabilities', liquid: false, liability: true,  color: '#c0392b' },
]

export function getCategoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id)!
}

export function getAssetsForCategory(assets: Asset[], category: CategoryId): Asset[] {
  return assets.filter((a) => a.category === category)
}

/** Latest value for an asset at or before `asOf` date (or absolute latest if omitted).
 *  Sorts entries by date first so insertion order in the JSON doesn't matter. */
export function getLatestValue(asset: Asset, asOf?: string): number {
  const sorted = [...asset.values].sort((a, b) => a.date.localeCompare(b.date))
  const eligible = asOf ? sorted.filter((v) => v.date <= asOf) : sorted
  if (eligible.length === 0) return 0
  return eligible[eligible.length - 1].value
}

/** All unique dates across the given assets, sorted ascending. */
export function getAllDates(assets: Asset[]): string[] {
  return [
    ...new Set(assets.flatMap((a) => a.values.map((v) => v.date))),
  ].sort()
}

export function categoryTotalAtDate(
  assets: Asset[],
  category: CategoryId,
  date: string,
): number {
  return getAssetsForCategory(assets, category).reduce(
    (sum, a) => sum + getLatestValue(a, date),
    0,
  )
}

/** Gross assets (positive categories only). */
export function grossAssetsAtDate(assets: Asset[], date: string): number {
  return CATEGORIES.filter((c) => !c.liability).reduce(
    (sum, c) => sum + categoryTotalAtDate(assets, c.id, date),
    0,
  )
}

/** Total liabilities at a date. */
export function liabilitiesTotalAtDate(assets: Asset[], date: string): number {
  return categoryTotalAtDate(assets, 'liabilities', date)
}

/** Total mortgage liabilities at a date. */
export function mortgagesTotalAtDate(assets: Asset[], date: string): number {
  return assets
    .filter((a) => a.category === 'liabilities' && a.type === 'mortgage')
    .reduce((sum, a) => sum + getLatestValue(a, date), 0)
}

export function networthAtDate(assets: Asset[], date: string): number {
  return grossAssetsAtDate(assets, date) - liabilitiesTotalAtDate(assets, date)
}

export function liquidTotalAtDate(assets: Asset[], date: string): number {
  return CATEGORIES.filter((c) => c.liquid && !c.liability).reduce(
    (sum, c) => sum + categoryTotalAtDate(assets, c.id, date),
    0,
  )
}

export function nonLiquidTotalAtDate(assets: Asset[], date: string): number {
  return CATEGORIES.filter((c) => !c.liquid && !c.liability).reduce(
    (sum, c) => sum + categoryTotalAtDate(assets, c.id, date),
    0,
  )
}

/** Latest known date across all assets. */
export function getLatestDate(assets: Asset[]): string {
  return getAllDates(assets).at(-1) ?? new Date().toISOString().slice(0, 10)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}
