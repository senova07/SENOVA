import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BoutonIcone } from '@/ui/Bouton'
import { Icone, type NomIcone } from '@/ui/Icone'
import { ToastContext, type Toast, type ToastContextValue, type TonToast } from '@/store/toastContext'
import '@/ui/Toast.css'

const DUREE_MS = 4200

const ICONE_TON: Record<TonToast, NomIcone> = { succes: 'accepte', info: 'info', alerte: 'attention' }

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
            <Icone nom={ICONE_TON[toast.ton]} taille={18} poids="fill" className="toast__icone" />
            <div className="toast__corps">
              <p className="toast__titre">{toast.titre}</p>
              {toast.message ? <p className="toast__message">{toast.message}</p> : null}
            </div>
            <BoutonIcone
              icone="fermer"
              libelle="Fermer la notification"
              className="toast__fermer"
              onClick={() => retirer(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
