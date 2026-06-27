import type { PropertyType } from '../../types/property'
import { PROPERTY_TYPE_LABELS } from '../../types/property'

const TYPE_STYLES: Record<PropertyType, string> = {
  terreno: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  lote: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
}

export function PropertyTypeBadge({ type }: { type: PropertyType }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide ring-1 ring-inset xl:text-xs ${TYPE_STYLES[type]}`}
    >
      {PROPERTY_TYPE_LABELS[type]}
    </span>
  )
}
