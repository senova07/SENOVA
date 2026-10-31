import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icone, type NomIcone } from '@/components/ui/Icone'

export type VarianteBouton = 'primaire' | 'secondaire' | 'danger' | 'fantome'
export type TailleBouton = 'sm' | 'md' | 'lg'

interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primaire` = navy plein (FACET) ; `secondaire` = contour. */
  variante?: VarianteBouton
  taille?: TailleBouton
  icone?: NomIcone
  bloc?: boolean
  children?: ReactNode
}

export function Bouton({
  variante = 'secondaire',
  taille = 'md',
  icone,
  bloc = false,
  className,
  children,
  type = 'button',
  ...reste
}: BoutonProps) {
  const classes = [
    'btn',
    `btn--${variante}`,
    taille !== 'md' ? `btn--${taille}` : '',
    bloc ? 'btn--bloc' : '',
    children ? '' : 'btn--icone',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...reste}>
      {icone ? <Icone nom={icone} taille={taille === 'sm' ? 16 : 18} /> : null}
      {children}
    </button>
  )
}
