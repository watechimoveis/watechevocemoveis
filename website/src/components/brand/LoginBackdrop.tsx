import type { ReactNode } from 'react'
import loginBg from '../../assets/bgterrenos.png'

interface LoginBackdropProps {
  children: ReactNode
}

export function LoginBackdrop({ children }: LoginBackdropProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <img
        src={loginBg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_30%]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/65" aria-hidden="true" />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  )
}
