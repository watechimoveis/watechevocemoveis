import type { PropertyType } from '../../types/property'
import { normalizePropertyType } from '../../utils/propertyDisplay'

type CoverAspect = 'card' | 'gallery'

interface PropertyCoverImageProps {
  src: string
  alt: string
  propertyType?: PropertyType | null
  aspect?: CoverAspect
  className?: string
  loading?: 'lazy' | 'eager'
  draggable?: boolean
}

const aspectClass: Record<CoverAspect, string> = {
  card: 'aspect-[4/3]',
  gallery: 'aspect-[4/3] sm:aspect-[16/9]',
}

export function PropertyCoverImage({
  src,
  alt,
  propertyType,
  aspect = 'card',
  className = '',
  loading = 'lazy',
  draggable,
}: PropertyCoverImageProps) {
  const isLand = normalizePropertyType(propertyType) === 'land'

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${aspectClass[aspect]} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={draggable}
        className={`absolute inset-0 h-full w-full object-center ${
          isLand ? 'object-contain' : 'object-cover'
        }`}
      />
    </div>
  )
}
