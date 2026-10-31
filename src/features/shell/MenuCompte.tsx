import { CaretDownIcon } from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ElementMenu, LibelleMenu, Menu, SeparateurMenu } from '@/ui/Menu'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import { initiales } from './initiales'

interface MenuCompteProps {
  /** `haut` : avatar de la barre du haut ; `barre` : bouton utilisateur du bas de la barre latérale. */
  variante: 'haut' | 'barre'
  replie?: boolean
}

/** Compte : changement d'entreprise (si plusieurs) et déconnexion. */
export function MenuCompte({ variante, replie = false }: MenuCompteProps) {
  const { session, seDeconnecter, changerOrganisation } = useSession()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (!session) return null

  const { nomComplet } = session.utilisateur
  const choisirOrganisation = async (id: string) => {
    if (id === session.organisation.id) return
    try {
      await changerOrganisation(id)
      // Une fiche d'une autre organisation n'existe pas : retour à l'accueil.
      if (pathname.startsWith('/clients/')) navigate('/')
    } catch (e) {
      notifier('Changement d’organisation impossible', {
        message: e instanceof Error ? e.message : undefined,
        ton: 'alerte',
      })
    }
  }

  return (
    <Menu
      libelle="Compte"
      aligne={variante === 'haut' ? 'droite' : 'gauche'}
      declencheur={({ ouvert, basculer }) =>
        variante === 'haut' ? (
          <button type="button" className="compte-haut" aria-haspopup="menu" aria-expanded={ouvert} aria-label={`Compte de ${nomComplet}`} onClick={basculer}>
            <span className="compte-haut__avatar">{initiales(nomComplet)}</span>
            <CaretDownIcon size={13} weight="bold" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="utilisateur-barre"
            aria-haspopup="menu"
            aria-expanded={ouvert}
            aria-label={replie ? `Compte de ${nomComplet}` : undefined}
            data-infobulle={replie ? nomComplet : undefined}
            onClick={basculer}
          >
            <span className="utilisateur-barre__avatar" aria-hidden>
              {initiales(nomComplet)}
            </span>
            {replie ? null : (
              <>
                <span className="utilisateur-barre__texte">
                  <span className="utilisateur-barre__nom">{nomComplet}</span>
                  <span className="utilisateur-barre__org">{session.organisation.nom}</span>
                </span>
                <CaretDownIcon size={15} weight="bold" className="utilisateur-barre__chevron" aria-hidden />
              </>
            )}
          </button>
        )
      }
    >
      {(fermer) => (
        <>
          {session.organisations.length > 1 ? (
            <>
              <LibelleMenu>Entreprise</LibelleMenu>
              {session.organisations.map((o) => (
                <ElementMenu
                  key={o.id}
                  role="menuitemradio"
                  aria-checked={o.id === session.organisation.id}
                  icone="entreprise"
                  onClick={() => {
                    fermer()
                    void choisirOrganisation(o.id)
                  }}
                >
                  {o.nom}
                </ElementMenu>
              ))}
              <SeparateurMenu />
            </>
          ) : null}
          <ElementMenu
            icone="deconnexion"
            onClick={() => {
              fermer()
              void seDeconnecter()
            }}
          >
            Se déconnecter
          </ElementMenu>
        </>
      )}
    </Menu>
  )
}
