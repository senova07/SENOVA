import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastContextValue } from '@/store/toastContext'

const DUREE_MS = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const minuteurs = useRef<number[]>([])

  useEffect(() => {
    const enCours = minuteurs.current
    return () => enCours.forEach((id) => window.clearTimeout(id))
  }, [])

  const retirer = useCallback((id: string) => {
    setToasts((liste) => liste.filter((t) => t.id !== id))
  }, [])

  const notifier = useCallback<ToastContextValue['notifier']>(
    (titre, options) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const toast: Toast = { id, titre, ton: options?.ton ?? 'succes', message: options?.message }
      setToasts((liste) => [...liste.slice(-2), toast])
      minuteurs.current.push(window.setTimeout(() => retirer(id), DUREE_MS))
    },
    [retirer],
  )

  const valeur = useMemo(() => ({ notifier }), [notifier])

  return (
    <ToastContext.Provider value={valeur}>
      {children}
      <div className="toast-pile" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.ton}`}>
            <span className="toast__marqueur" aria-hidden="true" />
            <div className="toast__corps">
              <p className="toast__titre">{toast.titre}</p>
              {toast.message ? <p className="toast__message">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="toast__fermer"
              onClick={() => retirer(toast.id)}
              aria-label="Fermer la notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
