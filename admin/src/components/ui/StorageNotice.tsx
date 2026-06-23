export function StorageNotice() {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="alert"
    >
      <p className="font-semibold">Fotos indisponíveis no servidor</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
        A API em produção precisa do <strong>Supabase Storage</strong> — no disco do Render free as fotos somem
        após redeploy.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-amber-900/95">
        <li>
          Supabase → <strong>Project Settings → API</strong> → copie <strong>Project URL</strong> e{' '}
          <strong>service_role</strong> (secret)
        </li>
        <li>
          Render → serviço <strong>watech-api</strong> → Environment → adicione{' '}
          <code className="rounded bg-amber-100/80 px-1">SUPABASE_URL</code> e{' '}
          <code className="rounded bg-amber-100/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code>
        </li>
        <li>Salve e aguarde o redeploy da API</li>
        <li>
          Confirme em{' '}
          <a
            href="https://watech-api.onrender.com/health"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-amber-950"
          >
            /health
          </a>{' '}
          → deve retornar <code className="rounded bg-amber-100/80 px-1">&quot;storage&quot;:&quot;supabase&quot;</code>
        </li>
        <li>Volte aqui e envie as fotos de novo</li>
      </ol>
    </div>
  )
}
