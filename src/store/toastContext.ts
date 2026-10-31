import { createContext, useContext } from 'react'

export type TonToast = 'succes' | 'info' | 'alerte'

export interface Toast {
  id: string
  titre: string
  message?: string
  ton: TonToast
}

export interface ToastContextValue {
  notifier(titre: string, options?: { message?: string; ton?: TonToast }): void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const valeur = useContext(ToastContext)
  if (!valeur) throw new Error('useToast doit être utilisé sous <ToastProvider>.')
  return valeur
}
