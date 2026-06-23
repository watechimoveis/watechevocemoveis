import type { PropertyStats } from '../../types/property'
import { whatsappConversionRate } from '../../utils/analytics'

interface PerformanceBarProps {
  stats?: PropertyStats
  compact?: boolean
}

export function PerformanceBar({ stats, compact = false }: PerformanceBarProps) {
  const views = stats?.views_7d ?? 0
  const whatsapp = stats?.whatsapp_clicks_7d ?? 0
  const max = Math.max(views, whatsapp, 1)
  const rate = stats ? whatsappConversionRate(stats) : null

  if (views === 0 && whatsapp === 0) {
    return <p className="type-meta text-slate-400">Sem dados ainda</p>
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
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
      <span className="type-meta w-14 shrink-0 text-slate-500">{label}</span>
      <div className="h-2 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(percent, value > 0 ? 8 : 0)}%` }}
        />
      </div>
      <span className="type-meta w-6 shrink-0 text-right tabular-nums text-slate-700">{value}</span>
    </div>
  )
}
