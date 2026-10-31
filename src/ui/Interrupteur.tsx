import type { InputHTMLAttributes, ReactNode } from 'react'
import './Interrupteur.css'

interface InterrupteurProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  libelle: ReactNode
  aide?: string
}

/** Interrupteur : case native `role="switch"`, la barre espace bascule. */
export function Interrupteur({ libelle, aide, className, ...reste }: InterrupteurProps) {
  return (
    <label className={['interrupteur', className ?? ''].filter(Boolean).join(' ')}>
      <input type="checkbox" role="switch" className="switch" {...reste} />
      <span className="interrupteur__texte">
        <span className="interrupteur__libelle">{libelle}</span>
        {aide ? <span className="interrupteur__aide">{aide}</span> : null}
      </span>
    </label>
  )
}
