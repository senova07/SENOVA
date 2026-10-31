import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { surSessionPerdue } from '@/services/http'
import { apiSession } from '@/services/sessionApi'
import { SessionContext, type EtatSession, type SessionContextValue } from '@/store/sessionContext'
import type { Session } from '@shared/session'

/**
 * Qui est connecté. La session vit dans un cookie serveur : on la lit au
 * démarrage, et si elle tombe (401 n'importe où) on revient à l'état anonyme,
 * ce que la garde de route traduit en redirection vers /connexion.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatSession>('chargement')
  const [session, setSession] = useState<Session | null>(null)

  const appliquer = useCallback((courante: Session | null) => {
    setSession(courante)
    setEtat(courante ? 'connecte' : 'anonyme')
  }, [])

  useEffect(() => {
    let vivant = true
    apiSession
      .courante()
      .then((courante) => vivant && appliquer(courante))
      .catch(() => vivant && appliquer(null))
    return () => {
      vivant = false
    }
  }, [appliquer])

  useEffect(() => surSessionPerdue(() => appliquer(null)), [appliquer])

  const valeur = useMemo<SessionContextValue>(
    () => ({
      etat,
      session,
      peut: (permission) => session?.permissions.some((p) => p === permission) ?? false,
      async seConnecter(email, motDePasse) {
        await apiSession.connexion(email, motDePasse)
        appliquer(await apiSession.courante())
      },
      async sInscrire(corps) {
        await apiSession.inscription(corps)
        appliquer(await apiSession.courante())
      },
      async seDeconnecter() {
        try {
          await apiSession.deconnexion()
        } finally {
          appliquer(null)
        }
      },
      async changerOrganisation(organisationId) {
        await apiSession.changerOrganisation(organisationId)
        appliquer(await apiSession.courante())
      },
    }),
    [etat, session, appliquer],
  )

  return <SessionContext.Provider value={valeur}>{children}</SessionContext.Provider>
}
