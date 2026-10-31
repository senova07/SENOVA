import { useEffect } from 'react'
import { CheckCircleIcon } from '@phosphor-icons/react'

export interface ToastData {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function Toast({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(onDismiss, 4500)
    return () => window.clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null
  return (
    <div className="toast" role="status" key={toast.id}>
      <CheckCircleIcon size={18} weight="fill" aria-hidden />
      <span>{toast.message}</span>
      {toast.actionLabel && (
        <button type="button" className="toast__action" onClick={() => { toast.onAction?.(); onDismiss() }}>
          {toast.actionLabel}
        </button>
      )}
    </div>
  )
}
