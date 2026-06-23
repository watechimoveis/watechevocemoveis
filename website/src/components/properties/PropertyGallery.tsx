import { useCallback, useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../../lib/api'
import type { PropertyImage } from '../../types/property'

interface PropertyGalleryProps {
  images: PropertyImage[]
  title?: string | null
}

const SWIPE_THRESHOLD = 50

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const alt = title || 'Imóvel'

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return
      setActiveIndex((index + images.length) % images.length)
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

  useEffect(() => {
    if (!lightboxOpen) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, goNext, goPrev])

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex aspect-[4/3] items-center justify-center md:aspect-[16/9]">
          <svg viewBox="0 0 24 24" className="h-24 w-24 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    )
  }

  const active = images[activeIndex] ?? images[0]

  return (
    <>
      <div className="space-y-3">
        <div
          className="group relative overflow-hidden rounded-2xl bg-slate-100"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full tap-highlight-none"
            aria-label="Ampliar imagem"
          >
            <img
              src={mediaUrl(active.url)}
              alt={alt}
              className="aspect-[4/3] w-full object-cover transition duration-300 md:aspect-[16/9]"
            />
          </button>

          {images.length > 1 && (
            <>
              <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {activeIndex + 1} / {images.length}
              </span>

              {/* Setas — desktop/tablet landscape */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white md:flex"
                aria-label="Foto anterior"
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white md:flex"
                aria-label="Próxima foto"
              >
                <ChevronIcon direction="right" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <>
            {/* Mobile: indicadores de ponto */}
            <div className="flex justify-center gap-1.5 md:hidden">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Foto ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Tablet/desktop: miniaturas */}
            <div className="hidden gap-2 overflow-x-auto pb-1 md:flex">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    index === activeIndex ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={mediaUrl(image.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-4 py-3 safe-top">
            <span className="text-sm font-medium text-white/80">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="rounded-full p-2 text-white/80 hover:bg-white/10"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={mediaUrl(active.url)}
              alt={alt}
              className="max-h-[80vh] max-w-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm active:scale-95"
                  aria-label="Foto anterior"
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm active:scale-95"
                  aria-label="Próxima foto"
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            )}
          </div>

          <div className="safe-bottom pb-4" />
        </div>
      )}
    </>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      {direction === 'left' ? (
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      )}
    </svg>
  )
}
