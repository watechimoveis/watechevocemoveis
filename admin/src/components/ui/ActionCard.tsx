import { Link } from 'react-router-dom'

interface ActionCardProps {
  to?: string
  onClick?: () => void
  title: string
  description: string
  icon: string
  variant?: 'primary' | 'default'
}

export function ActionCard({ to, onClick, title, description, icon, variant = 'default' }: ActionCardProps) {
  const className = `flex flex-col rounded-2xl border p-5 text-left transition hover:shadow-md ${
    variant === 'primary'
      ? 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700'
      : 'border-slate-200 bg-white hover:border-slate-300'
  }`

  const content = (
    <>
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <h3 className={`mt-3 text-base font-semibold xl:text-lg ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      <p className={`type-page-lead mt-1 ${variant === 'primary' ? 'text-blue-100' : 'text-slate-500'}`}>
        {description}
      </p>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}
