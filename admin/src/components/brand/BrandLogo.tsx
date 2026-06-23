import { BRAND } from '../../lib/brand'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  showTagline?: boolean
}

const sizeClasses = {
  sm: 'text-sm xl:text-base',
  md: 'text-base xl:text-lg',
  lg: 'text-2xl xl:text-3xl',
}

export function BrandLogo({ size = 'md', variant = 'dark', showTagline = false }: BrandLogoProps) {
  const sysColor = variant === 'light' ? 'text-white' : 'text-slate-900'
  const estateColor = variant === 'light' ? 'text-amber-400' : 'text-amber-600'

  return (
    <div>
      <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>
        <span className={sysColor}>Sys</span>
        <span className={estateColor}>Estate</span>
      </span>
      {showTagline && (
        <p
          className={`mt-1 type-section-label font-medium uppercase ${
            variant === 'light' ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {BRAND.tagline}
        </p>
      )}
    </div>
  )
}
