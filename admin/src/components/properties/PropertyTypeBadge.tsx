import type { ListingType, PropertyType } from '../../types/property'
import { LISTING_LABELS, PROPERTY_TYPE_LABELS } from '../../types/property'

const TYPE_STYLES: Record<PropertyType, string> = {
  land: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  house: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  apartment: 'bg-sky-50 text-sky-800 ring-sky-200/80',
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

export function ListingTypeBadge({ type }: { type: ListingType }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-600 ring-1 ring-slate-200/80 ring-inset xl:text-xs">
      {LISTING_LABELS[type]}
    </span>
  )
}
