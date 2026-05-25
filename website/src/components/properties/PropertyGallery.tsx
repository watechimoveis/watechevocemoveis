import { useState } from 'react'
import type { PropertyImage } from '../../types/property'

interface PropertyGalleryProps {
  images: PropertyImage[]
  title?: string | null
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const alt = title || 'Imóvel'

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex aspect-[16/9] items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-24 w-24 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    )
  }

  const active = images[activeIndex] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={active.url}
          alt={alt}
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === activeIndex ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
