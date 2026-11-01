import { SidebarSimpleIcon } from '@phosphor-icons/react'
import { useSession } from '@/store/sessionContext'
import { ElementNavigation } from './ElementNavigation'
import { MenuCompte } from './MenuCompte'
import { ENTREE_PARAMETRES, entreeVisible } from './navigation'

interface PiedBarreProps {
  replie: boolean
  onDeplier(): void
}

export function PiedBarre({ replie, onDeplier }: PiedBarreProps) {
  const { peut } = useSession()
  return (
    <div className="pied-barre">
      {entreeVisible(ENTREE_PARAMETRES, peut) ? <ElementNavigation entree={ENTREE_PARAMETRES} replie={replie} /> : null}
      {replie ? (
        <button type="button" className="element-nav" onClick={onDeplier} aria-label="Déplier le menu" data-infobulle="Déplier le menu">
          <SidebarSimpleIcon className="element-nav__icone" size={19} weight="regular" aria-hidden />
        </button>
      ) : null}
      <MenuCompte variante="barre" replie={replie} />
    </div>
  )
}
