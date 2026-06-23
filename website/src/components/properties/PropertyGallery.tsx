import { useCallback, useRef, useState } from 'react'
import { mediaUrl } from '../../lib/api'
import type { PropertyImage } from '../../types/property'

interface PropertyGalleryProps {
  images: PropertyImage[]
  title?: string | null
}

const SWIPE_THRESHOLD = 48

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const alt = title || 'Imóvel'

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return
      setActiveIndex(((index % images.length) + images.length) % images.length)
    },
    [images.length],
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || images.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) goNext()
    else goPrev()
  }

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex aspect-[4/3] items-center justify-center sm:aspect-[16/9]">
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
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-100 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={mediaUrl(active.url)}
          alt={alt}
          className="aspect-[4/3] w-full object-cover transition-opacity duration-200 sm:aspect-[16/9]"
          draggable={false}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white sm:flex"
              aria-label="Foto anterior"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white sm:flex"
              aria-label="Próxima foto"
            >
              <ChevronIcon direction="right" />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>

            <span className="absolute right-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`scroll-snap-item h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition active:scale-95 ${
                index === activeIndex ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={mediaUrl(image.url)} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      {direction === 'left' ? (
        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
      )}
    </svg>
  )
}
