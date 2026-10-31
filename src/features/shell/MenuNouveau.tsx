import { Fragment, useEffect } from 'react'
import { PlusIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import type { Permission } from '@shared/permissions'
import { ElementMenu, LibelleMenu, Menu, SeparateurMenu } from '@/ui/Menu'
import type { NomIcone } from '@/ui/Icone'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'

interface Creation {
  id: string
  libelle: string
  icone: NomIcone
  touche: string
  permission?: Permission
  /** Absent : l'écran de création n'existe pas encore. */
  chemin?: string
}

const CREATIONS: readonly Creation[] = [
  { id: 'devis', libelle: 'Nouveau devis', icone: 'devis', touche: 'D', permission: 'devis.gerer', chemin: '/devis?nouveau=1' },
  { id: 'facture', libelle: 'Nouvelle facture', icone: 'factures', touche: 'F', permission: 'factures.gerer' },
  { id: 'client', libelle: 'Nouveau client', icone: 'clients', touche: 'C', permission: 'clients.gerer', chemin: '/clients?nouveau=1' },
  { id: 'prestation', libelle: 'Nouvelle prestation', icone: 'prestations', touche: 'P' },
  { id: 'article', libelle: 'Nouvel article', icone: 'type_produit', touche: 'A', permission: 'articles.gerer', chemin: '/articles?nouveau=1' },
]

/** Raccourcis D/F/C/P/A : montés seulement quand le menu est ouvert. */
function Raccourcis({ creations, onChoisir }: { creations: readonly Creation[]; onChoisir(c: Creation): void }) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const creation = creations.find((c) => c.touche.toLowerCase() === e.key.toLowerCase())
      if (!creation) return
      e.preventDefault()
      onChoisir(creation)
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [creations, onChoisir])
  return null
}

/** Bouton universel « Nouveau » de la barre latérale et son menu de création. */
export function MenuNouveau({ replie }: { replie: boolean }) {
  const { peut } = useSession()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const creations = CREATIONS.filter((c) => !c.permission || peut(c.permission))
  if (creations.length === 0) return null

  const choisir = (c: Creation) => {
    if (c.chemin) navigate(c.chemin)
    else notifier('Bientôt disponible', { ton: 'info' })
  }

  return (
    <div className="nouveau-barre">
      <Menu
        libelle="Créer"
        declencheur={({ ouvert, basculer }) => (
          <button
            type="button"
            className="nouveau-barre__bouton"
            aria-haspopup="menu"
            aria-expanded={ouvert}
            data-infobulle={replie ? 'Nouveau' : undefined}
            onClick={basculer}
          >
            <PlusIcon size={16} weight="bold" aria-hidden />
            <span className={replie ? 'sr-only' : undefined}>Nouveau</span>
          </button>
        )}
      >
        {(fermer) => {
          const agir = (c: Creation) => {
            fermer()
            choisir(c)
          }
          return (
            <>
              <Raccourcis creations={creations} onChoisir={agir} />
              <LibelleMenu>Créer</LibelleMenu>
              {creations.map((c) => (
                <Fragment key={c.id}>
                  {c.id === 'article' ? <SeparateurMenu /> : null}
                  <ElementMenu icone={c.icone} raccourci={c.touche} onClick={() => agir(c)}>
                    {c.libelle}
                  </ElementMenu>
                </Fragment>
              ))}
            </>
          )
        }}
      </Menu>
    </div>
  )
}
