import type { ReactNode } from 'react'
import { Bouton } from '@/ui/Bouton'
import { Icone, type NomIcone } from '@/ui/Icone'
import { Menu } from '@/ui/Menu'

interface BoutonMenuProps {
  libelle: string
  icone?: NomIcone
  onPrincipal(): void
  /** Nom accessible de la flèche, qui ouvre les autres actions. */
  libelleMenu: string
  /** Éléments du menu (`ElementMenu`…) ; `fermer` à appeler après une action. */
  children(fermer: () => void): ReactNode
}

/** Bouton scindé « Nouvel article ▾ » : action principale à gauche, menu à droite. */
export function BoutonMenu({ libelle, icone, onPrincipal, libelleMenu, children }: BoutonMenuProps) {
  return (
    <div className="btn-menu">
      <Bouton variante="primaire" signature icone={icone} className="btn-menu__principal" onClick={onPrincipal}>
        {libelle}
      </Bouton>
      <Menu
        aligne="droite"
        libelle={libelleMenu}
        declencheur={({ ouvert, basculer }) => (
          <button
            type="button"
            className="btn btn--primary btn-menu__fleche"
            aria-label={libelleMenu}
            aria-haspopup="menu"
            aria-expanded={ouvert}
            onClick={basculer}
          >
            <Icone nom="chevron_bas" taille={14} poids="bold" />
          </button>
        )}
      >
        {children}
      </Menu>
    </div>
  )
}
