import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../../lib/api'
import { deletePropertyImage, uploadPropertyImages } from '../../services/propertiesService'
import { getApiHealth, isPhotoStorageReady, type ApiHealth } from '../../services/healthService'
import type { Property, PropertyImage } from '../../types/property'
import { HttpError } from '../../services/api'
import { StorageNotice } from '../ui/StorageNotice'

const MAX_PHOTOS = 15
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])

  const savedImages = property?.images ?? []
  const isDraft = !property?.id
  const totalCount = savedImages.length + pendingFiles.length
  const atLimit = totalCount >= MAX_PHOTOS
  const uploadsDisabled = storageBlocked || uploading

  useEffect(() => {
    let cancelled = false
    getApiHealth()
      .then((health: ApiHealth) => {
        if (!cancelled) setStorageBlocked(!isPhotoStorageReady(health))
      })
      .catch(() => {
        /* health opcional — upload ainda pode funcionar em dev local */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isDraft || pendingFiles.length === 0) {
      setPreviews([])
      return
    }
    const urls = pendingFiles.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [isDraft, pendingFiles])

  function validateFiles(files: File[]): { valid: File[]; message?: string } {
    const remaining = MAX_PHOTOS - totalCount
    if (remaining <= 0) {
      return { valid: [], message: `Limite de ${MAX_PHOTOS} fotos por anúncio.` }
    }

    const valid: File[] = []
    const rejected: string[] = []

    for (const file of files.slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: formato não suportado`)
        continue
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name}: maior que 5MB`)
        continue
      }
      valid.push(file)
    }

    if (files.length > remaining) {
      rejected.push(`Só mais ${remaining} foto(s) permitida(s)`)
    }

    return {
      valid,
      message: rejected.length ? rejected.slice(0, 2).join(' · ') : undefined,
    }
  }

  async function addFiles(files: File[]) {
    if (!files.length) return
    const { valid, message } = validateFiles(files)
    if (message) setError(message)
    if (!valid.length) return

    setError('')

    if (isDraft) {
      onPendingChange?.([...pendingFiles, ...valid])
      return
    }

    if (!property || !onChange) return

    setUploading(true)
    try {
      const uploaded = await uploadPropertyImages(property.id, valid)
      onChange([...savedImages, ...uploaded])
    } catch (err) {
      if (err instanceof HttpError && err.code === 'STORAGE_NOT_CONFIGURED') {
        setStorageBlocked(true)
        setError('')
      } else {
        setError(err instanceof HttpError ? err.message : 'Erro ao enviar fotos.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return
    await addFiles(Array.from(selected))
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (atLimit || uploadsDisabled) return
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    void addFiles(files)
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

  const hasPhotos = totalCount > 0

  return (
    <section className="space-y-3 border-t border-slate-100 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Fotos</h3>
          <p className="text-xs text-slate-500">
            JPG, PNG ou WebP · até 5MB · máx. {MAX_PHOTOS} fotos
            {totalCount > 0 ? ` · ${totalCount}/${MAX_PHOTOS}` : ''}
          </p>
        </div>
        {!atLimit && (
          <button
            type="button"
            disabled={uploadsDisabled}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {uploading ? 'Enviando…' : '+ Adicionar'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isDraft && !hasPhotos && (
        <p className="text-xs text-amber-700">
          Anúncios com fotos recebem mais cliques no site — recomendamos pelo menos 3 imagens.
        </p>
      )}

      {storageBlocked && <StorageNotice />}

      {error && !storageBlocked && <p className="text-xs text-red-600">{error}</p>}

      {!hasPhotos ? (
        <button
          type="button"
          disabled={uploadsDisabled || atLimit}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-sm transition ${
            dragOver
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700'
          }`}
        >
          <span className="text-3xl">📷</span>
          <span className="mt-2 font-medium">Arraste fotos ou clique para selecionar</span>
          <span className="mt-1 text-xs text-slate-400">A primeira foto será a capa do anúncio</span>
        </button>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!atLimit) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl p-1 transition ${dragOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-offset-2' : ''}`}
        >
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
          {!atLimit && (
            <button
              type="button"
              disabled={uploadsDisabled}
              onClick={() => inputRef.current?.click()}
              className="mt-2 w-full rounded-lg border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-700"
            >
              + Adicionar mais fotos
            </button>
          )}
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
        <span className="absolute bottom-1.5 left-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Aguardando
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
