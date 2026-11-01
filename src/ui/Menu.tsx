import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { BoutonIcone } from '@/ui/Bouton'
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
  /** `false` : pas de panneau, l'appelant fournit le sien (popover de filtres, panneaux d'outils). */
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

interface MenuLigneProps {
  /** Nom accessible du bouton ⋮ et du menu (« Actions : … »). */
  libelle: string
  /** Ouvre vers le haut (dernières lignes d'un tableau). */
  versLeHaut?: boolean
  children(fermer: () => void): ReactNode
}

/** Menu ⋮ d'une ligne de tableau : bouton icône, panneau aligné à droite, ouverture vers le haut si besoin. */
export function MenuLigne({ libelle, versLeHaut = false, children }: MenuLigneProps) {
  return (
    <div className={versLeHaut ? 'menu-ligne menu-ligne--haut' : 'menu-ligne'}>
      <Menu
        aligne="droite"
        libelle={libelle}
        declencheur={({ ouvert, basculer }) => (
          <BoutonIcone
            icone="actions"
            poids="bold"
            libelle={libelle}
            aria-haspopup="menu"
            aria-expanded={ouvert}
            onClick={basculer}
          />
        )}
      >
        {children}
      </Menu>
    </div>
  )
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
