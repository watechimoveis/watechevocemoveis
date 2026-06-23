import type { PropertyStats } from '../../types/property'
import { whatsappConversionRate } from '../../utils/analytics'

interface PerformanceBarProps {
  stats?: PropertyStats
  compact?: boolean
  variant?: 'bars' | 'inline'
}

export function PerformanceBar({ stats, compact = false, variant = 'bars' }: PerformanceBarProps) {
  const views = stats?.views_7d ?? 0
  const whatsapp = stats?.whatsapp_clicks_7d ?? 0
  const max = Math.max(views, whatsapp, 1)
  const rate = stats ? whatsappConversionRate(stats) : null

  if (views === 0 && whatsapp === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 type-meta text-slate-400">
        Sem dados
      </span>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <MetricBadge label="Views" value={views} tone="blue" />
        <MetricBadge label="WhatsApp" value={whatsapp} tone="emerald" />
        {rate && (
          <span className="type-meta font-medium text-emerald-700">{rate}</span>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? 'min-w-[9.5rem] space-y-1.5' : 'space-y-2'}>
      <MetricRow label="Views" value={views} percent={(views / max) * 100} color="bg-blue-500" />
      <MetricRow label="WhatsApp" value={whatsapp} percent={(whatsapp / max) * 100} color="bg-emerald-500" />
      {rate && !compact && (
        <p className="type-meta text-slate-500">
          Conversão <span className="font-medium text-emerald-700">{rate}</span>
        </p>
      )}
    </div>
  )
}

function MetricBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'blue' | 'emerald'
}) {
  const styles =
    tone === 'blue'
      ? 'border-blue-100 bg-blue-50 text-blue-800'
      : 'border-emerald-100 bg-emerald-50 text-emerald-800'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 type-meta font-medium tabular-nums ${styles}`}
      title={`${label} (7 dias)`}
    >
      <MetricIcon tone={tone} />
      <span className="hidden xl:inline">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  )
}

function MetricIcon({ tone }: { tone: 'blue' | 'emerald' }) {
  const color = tone === 'blue' ? 'text-blue-500' : 'text-emerald-500'

  if (tone === 'blue') {
    return (
      <svg className={`h-3.5 w-3.5 shrink-0 ${color}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path
          fillRule="evenodd"
          d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          clipRule="evenodd"
        />
      </svg>
    )
  }

  return (
    <svg className={`h-3.5 w-3.5 shrink-0 ${color}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 0 1-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7ZM7 9H5v2h2V9Zm8 0h-2v2h2V9ZM9 9h2v2H9V9Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MetricRow({
  label,
  value,
  percent,
  color,
}: {
  label: string
  value: number
  percent: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="type-meta w-[4.25rem] shrink-0 text-slate-500">{label}</span>
      <div className="h-2 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(percent, value > 0 ? 8 : 0)}%` }}
        />
      </div>
      <span className="type-meta w-7 shrink-0 text-right tabular-nums text-slate-700">{value}</span>
    </div>
  )
}
