import { formatArea } from '../../utils/propertyDisplay'

interface LandListingMetaProps {
  size: number | null | undefined
  className?: string
}

export function LandListingMeta({ size, className }: LandListingMetaProps) {
  const area = formatArea(size)

  if (!area) return null

  return (
    <p className={className ?? 'mt-0.5 text-sm font-semibold text-slate-700'}>
      {area}
    </p>
  )
}
