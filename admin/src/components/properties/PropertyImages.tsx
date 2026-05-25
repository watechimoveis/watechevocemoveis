import { useRef, useState } from 'react'
import { mediaUrl } from '../../lib/api'
import { deletePropertyImage, uploadPropertyImages } from '../../services/propertiesService'
import type { Property, PropertyImage } from '../../types/property'
import { HttpError } from '../../services/api'

interface PropertyImagesProps {
  property: Property
  onChange: (images: PropertyImage[]) => void
}

export function PropertyImages({ property, onChange }: PropertyImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadPropertyImages(property.id, Array.from(selected))
      onChange([...property.images, ...uploaded])
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao enviar fotos.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(imageId: string) {
    setError('')
    try {
      await deletePropertyImage(property.id, imageId)
      onChange(property.images.filter((img) => img.id !== imageId))
    } catch {
      setError('Erro ao remover foto.')
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Fotos</h3>
          <p className="text-xs text-slate-500">JPG, PNG ou WebP — até 5MB cada</p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          {uploading ? 'Enviando…' : '+ Adicionar fotos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {property.images.length === 0 ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
        >
          <span className="text-2xl">📷</span>
          <span className="mt-2 font-medium">Clique para adicionar fotos</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {property.images.map((image, index) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              <img
                src={mediaUrl(image.url)}
                alt={`Foto ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Remover foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
