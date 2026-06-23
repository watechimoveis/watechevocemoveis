import type { ReactNode } from 'react'
import loginBg from '../../assets/bgterrenos01.png'

interface LoginBackdropProps {
  children: ReactNode
}

export function LoginBackdrop({ children }: LoginBackdropProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <img
        src={loginBg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] sm:object-[65%_30%]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}
