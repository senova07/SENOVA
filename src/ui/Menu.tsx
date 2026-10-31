import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icone, type NomIcone } from '@/ui/Icone'
import { useMenu } from '@/ui/useMenu'
import './Menu.css'

interface MenuProps {
  /** Le bouton d'ouverture : il pose lui-même aria-haspopup, aria-expanded et l'appel à `basculer`. */
  declencheur(etat: { ouvert: boolean; basculer(): void }): ReactNode
  /** Contenu du menu ouvert ; `fermer` à appeler après une action. */
  children(fermer: () => void): ReactNode
  aligne?: 'gauche' | 'droite'
  /** Nom accessible du menu. */
  libelle?: string
  /** `false` : pas de panneau, l'appelant fournit le sien (ancien usage `.menu__liste`). */
  panneau?: boolean
}

/** Menu déroulant appuyé sur useMenu : Échap, flèches, clic extérieur, retour du focus. */
export function Menu({ declencheur, children, aligne = 'gauche', libelle, panneau = true }: MenuProps) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  return (
    <div className="menu-ancre" ref={ancre}>
      {declencheur({ ouvert, basculer })}
      {ouvert ? (
        panneau ? (
          <div className={`menu menu--${aligne}`} role="menu" aria-label={libelle}>
            {children(fermer)}
          </div>
        ) : (
          children(fermer)
        )
      ) : null}
    </div>
  )
}

/** Alias de l'ancien nom : le panneau reste à la charge de l'appelant. À retirer en phase 4. */
export function MenuDeroulant(props: Omit<MenuProps, 'panneau' | 'aligne' | 'libelle'>) {
  return <Menu {...props} panneau={false} />
}

interface ElementMenuProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icone?: NomIcone
  danger?: boolean
  /** Raccourci clavier affiché à droite. */
  raccourci?: string
}

export function ElementMenu({ icone, danger = false, raccourci, className, children, type = 'button', ...reste }: ElementMenuProps) {
  const classes = ['menu__item', danger ? 'menu__item--danger' : '', className ?? ''].filter(Boolean).join(' ')
  return (
    <button type={type} role="menuitem" className={classes} {...reste}>
      {icone ? <Icone nom={icone} taille={16} /> : null}
      {children}
      {raccourci ? <span className="kbd">{raccourci}</span> : null}
    </button>
  )
}

export function SeparateurMenu() {
  return <div className="menu__sep" role="separator" />
}

export function LibelleMenu({ children }: { children: ReactNode }) {
  return (
    <div className="menu__label" role="presentation">
      {children}
    </div>
  )
}
