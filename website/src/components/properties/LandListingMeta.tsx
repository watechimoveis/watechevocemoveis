import { formatArea, formatPricePerSqm } from '../../utils/propertyDisplay'

interface LandListingMetaProps {
  price: number | null | undefined
  size: number | null | undefined
  className?: string
}

/** Área + valor/m² em uma linha secundária — evita parecer um segundo preço total. */
export function LandListingMeta({ price, size, className }: LandListingMetaProps) {
  const area = formatArea(size)
  const pricePerSqm = formatPricePerSqm(price, size)

  if (!area && !pricePerSqm) return null

  return (
    <p className={className ?? 'mt-0.5 text-sm text-slate-600'}>
      {area && <span className="font-semibold text-slate-700">{area}</span>}
      {area && pricePerSqm && (
        <span className="mx-1.5 text-slate-300" aria-hidden="true">
          ·
        </span>
      )}
      {pricePerSqm && <span className="text-slate-500">{pricePerSqm}</span>}
    </p>
  )
}
