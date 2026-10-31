import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icone, type NomIcone } from '@/ui/Icone'
import './Bouton.css'

export type VarianteBouton = 'primaire' | 'secondaire' | 'danger' | 'fantome'
export type TailleBouton = 'sm' | 'md' | 'lg'

const CLASSE_VARIANTE: Record<VarianteBouton, string> = {
  primaire: 'btn--primary',
  secondaire: 'btn--secondary',
  danger: 'btn--secondary btn--danger',
  fantome: 'btn--ghost',
}

interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBouton
  taille?: TailleBouton
  icone?: NomIcone
  bloc?: boolean
  /** Micro-facette turquoise dans le coin (boutons principaux). */
  signature?: boolean
  children?: ReactNode
}

export function Bouton({
  variante = 'secondaire',
  taille = 'md',
  icone,
  bloc = false,
  signature = false,
  className,
  children,
  type = 'button',
  ...reste
}: BoutonProps) {
  const classes = [
    'btn',
    CLASSE_VARIANTE[variante],
    taille !== 'md' ? `btn--${taille}` : '',
    bloc ? 'btn--bloc' : '',
    signature ? 'btn--signature' : '',
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

interface BoutonIconeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icone: NomIcone
  /** Nom accessible, obligatoire : le bouton n'a pas de texte. */
  libelle: string
  poids?: 'regular' | 'fill' | 'bold'
}

/** Bouton carré sans texte, fond au survol seulement. */
export function BoutonIcone({ icone, libelle, poids = 'regular', className, type = 'button', ...reste }: BoutonIconeProps) {
  return (
    <button type={type} className={['icon-btn', className ?? ''].filter(Boolean).join(' ')} aria-label={libelle} {...reste}>
      <Icone nom={icone} taille={18} poids={poids} />
    </button>
  )
}
