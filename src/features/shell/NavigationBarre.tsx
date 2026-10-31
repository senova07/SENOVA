import { useSession } from '@/store/sessionContext'
import { ElementNavigation, type Compteur } from './ElementNavigation'
import { groupesVisibles } from './navigation'

interface NavigationBarreProps {
  replie: boolean
  /** Compteurs par chemin d'entrée. */
  compteurs: Readonly<Record<string, Compteur>>
}

export function NavigationBarre({ replie, compteurs }: NavigationBarreProps) {
  const { peut } = useSession()
  return (
    <nav className="navigation-barre" aria-label="Sections">
      {groupesVisibles(peut).map((groupe) => (
        <div key={groupe.id} className="navigation-barre__groupe">
          {groupe.libelle ? <div className="navigation-barre__titre">{groupe.libelle}</div> : null}
          {groupe.entrees.map((entree) => (
            <ElementNavigation key={entree.chemin} entree={entree} replie={replie} compteur={compteurs[entree.chemin]} />
          ))}
        </div>
      ))}
    </nav>
  )
}
