import { useRef, useState, type ReactNode } from 'react'
import { useDismiss } from '../../lib/useDismiss'

interface Props {
  /** Contenu du bouton déclencheur */
  label: ReactNode
  className?: string
  align?: 'left' | 'right'
  width?: number
  disabled?: boolean
  title?: string
  ariaLabel?: string
  /** Rendu du panneau ; reçoit une fonction de fermeture */
  children: (close: () => void) => ReactNode
}

/** Bouton + panneau flottant, fermé au clic extérieur ou avec Échap. */
export function Dropdown({ label, className = 'btn btn--secondary btn--sm', align = 'left', width = 260, disabled, title, ariaLabel, children }: Props) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  useDismiss(open, [btnRef, panelRef], close)

  return (
    <div className="dd">
      <button
        ref={btnRef}
        type="button"
        className={className}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open && (
        <div ref={panelRef} className="menu dd__panel" data-align={align} style={{ width }} role="dialog">
          {children(close)}
        </div>
      )}
    </div>
  )
}
