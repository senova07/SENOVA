import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { Logo } from '@/ui/Logo'
import { NAVIGATION, cheminActif, type RubriqueNav } from '@/components/layout/navigation'
import { useMenu } from '@/ui/useMenu'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'

interface RubriqueProps {
  rubrique: RubriqueNav
  repliee: boolean
  ouverte: boolean
  onBasculer(): void
}

function SousPages({ rubrique, actif }: { rubrique: RubriqueNav; actif?: string }) {
  return (
    <>
      {rubrique.enfants?.map((e) => (
        <li key={e.chemin}>
          <Link
            to={e.chemin}
            className="sous-item"
            title={e.libelle}
            aria-current={e.chemin === actif ? 'page' : undefined}
          >
            {e.libelle}
          </Link>
        </li>
      ))}
    </>
  )
}

/** Sidebar repliée : la rubrique ouvre un panneau flottant à droite avec ses sous-pages. */
function RubriqueFlottante({ rubrique, actif }: { rubrique: RubriqueNav; actif?: string }) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const [haut, setHaut] = useState(0)
  return (
    <li className="menu-ancre" ref={ancre}>
      <button
        type="button"
        className={`nav-item ${actif ? 'nav-item--contient-actif' : ''}`}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={`flottant-${rubrique.id}`}
        title={rubrique.libelle}
        onClick={(e) => {
          setHaut(e.currentTarget.getBoundingClientRect().top)
          basculer()
        }}
      >
        <span className="nav-item__icone">
          <Icone nom={rubrique.icone} taille={18} />
        </span>
        <span className="nav-item__libelle">{rubrique.libelle}</span>
      </button>
      {ouvert ? (
        <div
          id={`flottant-${rubrique.id}`}
          className="flottant"
          style={{ top: haut, maxHeight: `calc(100vh - ${haut}px - 8px)` }}
          role="menu"
          aria-label={rubrique.libelle}
        >
          <p className="flottant__titre" aria-hidden="true">
            {rubrique.libelle}
          </p>
          <ul className="flottant__liste" role="none">
            {rubrique.enfants?.map((e) => (
              <li key={e.chemin} role="none">
                <Link
                  to={e.chemin}
                  role="menuitem"
                  className="sous-item"
                  aria-current={e.chemin === actif ? 'page' : undefined}
                  onClick={fermer}
                >
                  {e.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

function Rubrique({ rubrique, repliee, ouverte, onBasculer }: RubriqueProps) {
  const { pathname, search } = useLocation()
  if (!rubrique.enfants) {
    return (
      <li>
        <NavLink
          to={rubrique.chemin ?? '/'}
          end={rubrique.chemin === '/'}
          className="nav-item"
          title={rubrique.libelle}
        >
          <span className="nav-item__icone">
            <Icone nom={rubrique.icone} taille={18} />
          </span>
          <span className="nav-item__libelle">{rubrique.libelle}</span>
        </NavLink>
      </li>
    )
  }
  const actif = cheminActif(rubrique.enfants, pathname, search)
  if (repliee) return <RubriqueFlottante rubrique={rubrique} actif={actif} />
  const idListe = `sous-menu-${rubrique.id}`
  return (
    <li>
      <button
        type="button"
        className={`nav-item nav-item--groupe ${actif ? 'nav-item--contient-actif' : ''}`}
        aria-expanded={ouverte}
        aria-controls={idListe}
        onClick={onBasculer}
      >
        <span className="nav-item__icone">
          <Icone nom={rubrique.icone} taille={18} />
        </span>
        <span className="nav-item__libelle">{rubrique.libelle}</span>
        <Icone nom="chevron_bas" taille={14} className="nav-item__chevron" />
      </button>
      {ouverte ? (
        <ul className="sous-menu" id={idListe}>
          <SousPages rubrique={rubrique} actif={actif} />
        </ul>
      ) : null}
    </li>
  )
}

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('')
}

/** Bas de sidebar : avatar, nom, organisation ; le chevron ouvre organisations et déconnexion. */
function Compte() {
  const { session, seDeconnecter, changerOrganisation } = useSession()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { ouvert, ancre, basculer, fermer } = useMenu()
  if (!session) return null

  const choisirOrganisation = async (id: string) => {
    fermer()
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
    <div className="sidebar__compte menu" ref={ancre}>
      <button
        type="button"
        className="compte"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={basculer}
      >
        <span className="avatar" aria-hidden="true">
          {initiales(session.utilisateur.nomComplet)}
        </span>
        <span className="compte__texte">
          <span className="compte__nom">{session.utilisateur.nomComplet}</span>
          <span className="compte__org">{session.organisation.nom}</span>
        </span>
        <Icone nom="chevron_bas" taille={14} poids="regular" className="compte__chevron" />
      </button>
      {ouvert ? (
        <div className="menu__liste menu__liste--haut" role="menu" aria-label="Compte">
          {session.organisations.length > 1
            ? session.organisations.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={o.id === session.organisation.id}
                  className="menu__item"
                  onClick={() => void choisirOrganisation(o.id)}
                >
                  <Icone nom="entreprise" taille={18} />
                  {o.nom}
                </button>
              ))
            : null}
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => void seDeconnecter()}
          >
            <Icone nom="deconnexion" taille={18} />
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  )
}

interface SidebarProps {
  repliee: boolean
  onBasculer(): void
}

/**
 * Sidebar navy : bloc logo blanc coupé en biais, rubriques avec sous-menus (une seule ouverte,
 * celle de la page courante par défaut), poignée de repli sur le bord droit (Ctrl+B).
 */
export function Sidebar({ repliee, onBasculer }: SidebarProps) {
  const { pathname, search } = useLocation()
  const position = pathname
  const rubriqueActive =
    NAVIGATION.find((r) => r.enfants && cheminActif(r.enfants, pathname, search))?.id ?? null
  // Choix manuel valable pour la page où il a été fait ; en changeant de page, la rubrique active s'ouvre.
  const [choix, setChoix] = useState<{ position: string; ouverte: string | null } | null>(null)
  const ouverte = choix?.position === position ? choix.ouverte : rubriqueActive
  const libelleRepli = repliee ? 'Déplier le menu' : 'Replier le menu'

  return (
    <aside className="sidebar" aria-label="Menu principal">
      <div className="sidebar__entete">
        <Logo />
      </div>
      <button
        type="button"
        className="sidebar__poignee"
        aria-label={libelleRepli}
        aria-pressed={repliee}
        title={`${libelleRepli} (Ctrl+B)`}
        onClick={onBasculer}
      >
        <Icone nom={repliee ? 'suivant' : 'precedent'} taille={13} poids="bold" />
      </button>
      <nav className="sidebar__nav" aria-label="Navigation">
        <ul className="sidebar__liste">
          {NAVIGATION.map((r) => (
            <Rubrique
              key={r.id}
              rubrique={r}
              repliee={repliee}
              ouverte={ouverte === r.id}
              onBasculer={() => setChoix({ position, ouverte: ouverte === r.id ? null : r.id })}
            />
          ))}
        </ul>
      </nav>
      <div className="sidebar__pied">
        <Compte />
      </div>
    </aside>
  )
}
