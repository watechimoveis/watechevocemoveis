import { useEffect, useState } from 'react'
import { PropertyCard } from './PropertyCard'
import { getSimilarProperties } from '../../services/propertiesService'
import type { Property } from '../../types/property'

interface SimilarPropertiesProps {
  propertyId: string
}

export function SimilarProperties({ propertyId }: SimilarPropertiesProps) {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSimilarProperties(propertyId)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [propertyId])

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-slate-900">Imóveis parecidos</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <h2 className="text-lg font-semibold text-slate-900">Imóveis parecidos</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cada anúncio com contato direto ao corretor responsável.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <PropertyCard key={item.id} property={item} />
        ))}
      </div>
    </section>
  )
}
