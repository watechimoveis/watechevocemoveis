import { useState } from 'react'

interface SharePropertyButtonProps {
  title: string
  url: string
}

export function SharePropertyButton({ title, url }: SharePropertyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copie o link:', url)
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch {
        /* cancelado pelo usuário */
      }
    }
    await copyLink()
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Compartilhar
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        {copied ? 'Link copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}
