import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/store/sessionContext'

/** Garde : sans session, redirection vers /connexion (la page demandée est retenue). */
export function RouteProtegee() {
  const { etat } = useSession()
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
  const { etat } = useSession()
  if (etat === 'connecte') return <Navigate to="/" replace />
  return <Outlet />
}
