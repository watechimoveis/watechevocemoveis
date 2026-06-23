import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../../lib/api'
import { deletePropertyImage, uploadPropertyImages } from '../../services/propertiesService'
import type { Property, PropertyImage } from '../../types/property'
import { HttpError } from '../../services/api'

interface PropertyImagesProps {
  property?: Property | null
  pendingFiles?: File[]
  onPendingChange?: (files: File[]) => void
  onChange?: (images: PropertyImage[]) => void
}

export function PropertyImages({
  property,
  pendingFiles = [],
  onPendingChange,
  onChange,
}: PropertyImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState<string[]>([])

  const savedImages = property?.images ?? []
  const isDraft = !property?.id

  useEffect(() => {
    if (!isDraft || pendingFiles.length === 0) {
      setPreviews([])
      return
    }
    const urls = pendingFiles.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [isDraft, pendingFiles])

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return
    const files = Array.from(selected)

    if (isDraft) {
      onPendingChange?.([...pendingFiles, ...files])
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (!property || !onChange) return

    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadPropertyImages(property.id, files)
      onChange([...savedImages, ...uploaded])
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Erro ao enviar fotos.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removePending(index: number) {
    onPendingChange?.(pendingFiles.filter((_, i) => i !== index))
  }

  async function handleRemove(imageId: string) {
    if (!property || !onChange) return
    setError('')
    try {
      await deletePropertyImage(property.id, imageId)
      onChange(savedImages.filter((img) => img.id !== imageId))
    } catch {
      setError('Erro ao remover foto.')
    }
  }

  const hasPhotos = savedImages.length > 0 || pendingFiles.length > 0

  return (
    <section className="space-y-3 border-t border-slate-100 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Fotos</h3>
          <p className="text-xs text-slate-500">
            JPG, PNG ou WebP — até 5MB cada
            {isDraft && pendingFiles.length > 0 ? ` · ${pendingFiles.length} selecionada(s)` : ''}
          </p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
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

      {isDraft && (
        <p className="text-xs text-slate-500">
          Selecione agora — as fotos serão enviadas automaticamente ao criar o anúncio.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!hasPhotos ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
        >
          <span className="text-2xl">📷</span>
          <span className="mt-2 font-medium">Clique para adicionar fotos</span>
          <span className="mt-1 text-xs text-slate-400">A primeira foto será a capa do anúncio</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {savedImages.map((image, index) => (
            <PhotoTile
              key={image.id}
              src={mediaUrl(image.url)}
              alt={`Foto ${index + 1}`}
              isCover={index === 0}
              onRemove={() => handleRemove(image.id)}
            />
          ))}
          {previews.map((src, index) => (
            <PhotoTile
              key={src}
              src={src}
              alt={`Prévia ${index + 1}`}
              isCover={savedImages.length === 0 && index === 0}
              pending
              onRemove={() => removePending(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PhotoTile({
  src,
  alt,
  isCover,
  pending,
  onRemove,
}: {
  src: string
  alt: string
  isCover: boolean
  pending?: boolean
  onRemove: () => void
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {isCover && (
        <span className="absolute left-1.5 top-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
          Capa
        </span>
      )}
      {pending && (
        <span className="absolute left-1.5 bottom-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Pendente
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Remover foto"
      >
        ✕
      </button>
    </div>
  )
}
