import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession, type SessionContextValue } from '@/store/sessionContext'
import { isolerDemo } from './isolationDemo'

function suivreOrganisation({ etat, session }: SessionContextValue) {
  if (etat === 'connecte' && session) isolerDemo(session.organisation.id)
  else if (etat === 'anonyme') isolerDemo(null)
}

/** Garde : sans session, redirection vers /connexion (la page demandée est retenue). */
export function RouteProtegee() {
  const contexte = useSession()
  const { etat } = contexte
  suivreOrganisation(contexte)
  const lieu = useLocation()

  if (etat === 'chargement') {
    return (
      <div className="chargement" role="status">
        Chargement…
      </div>
    )
  }
  if (etat === 'anonyme') return <Navigate to="/connexion" replace state={{ depuis: lieu.pathname }} />
  return <Outlet />
}

/** Pages publiques (connexion, inscription) : un utilisateur connecté retourne à l'accueil. */
export function RoutePublique() {
  const contexte = useSession()
  const { etat } = contexte
  suivreOrganisation(contexte)
  if (etat === 'connecte') return <Navigate to="/" replace />
  return <Outlet />
}
