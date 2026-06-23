import { useState } from 'react'
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

function CoverPlaceholder({ aspect }: { aspect: CoverAspect }) {
  return (
    <div
      className={`flex items-center justify-center bg-slate-100 text-slate-300 ${aspectClass[aspect]}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
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
  const [failed, setFailed] = useState(false)
  const isLand = normalizePropertyType(propertyType) === 'land'

  if (!src || failed) {
    return <CoverPlaceholder aspect={aspect} />
  }

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${aspectClass[aspect]} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={draggable}
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full object-center ${
          isLand ? 'object-contain' : 'object-cover'
        }`}
      />
    </div>
  )
}
