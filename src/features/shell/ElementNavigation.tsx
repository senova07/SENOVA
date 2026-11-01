import { NavLink } from 'react-router-dom'
import type { EntreeNavigation } from './navigation'

export interface Compteur {
  valeur: number
  /** Ton d'alerte (ex. éléments en retard) ; sinon « à traiter ». */
  alerte?: boolean
}

interface ElementNavigationProps {
  entree: EntreeNavigation
  replie: boolean
  compteur?: Compteur
}

/** Entrée de navigation : icône Phosphor sans conteneur ; l'entrée active devient une plaque blanche. */
export function ElementNavigation({ entree, replie, compteur }: ElementNavigationProps) {
  const Pictogramme = entree.icone
  return (
    <NavLink
      to={entree.chemin}
      end={entree.chemin === '/'}
      className="element-nav"
      data-infobulle={replie ? entree.libelle : undefined}
    >
      {({ isActive }) => (
        <>
          <Pictogramme className="element-nav__icone" size={19} weight={isActive ? 'bold' : 'fill'} aria-hidden />
          <span className={replie ? 'sr-only' : 'element-nav__libelle'}>{entree.libelle}</span>
          {compteur && compteur.valeur > 0 ? (
            <span className={`element-nav__compteur${compteur.alerte ? ' element-nav__compteur--alerte' : ''}`}>
              <span aria-hidden>{compteur.valeur}</span>
              <span className="sr-only">: {compteur.valeur} {compteur.alerte ? 'en retard' : 'à traiter'}</span>
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}
