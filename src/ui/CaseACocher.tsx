import type { InputHTMLAttributes, ReactNode } from 'react'
import './CaseACocher.css'

interface CaseACocherProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  libelle: ReactNode
}

/** Case avec libellé cliquable ; l'apparence (coche blanche sur turquoise) vient de base.css. */
export function CaseACocher({ libelle, className, ...reste }: CaseACocherProps) {
  return (
    <label className={['case-cocher', className ?? ''].filter(Boolean).join(' ')}>
      <input type="checkbox" {...reste} />
      <span>{libelle}</span>
    </label>
  )
}
