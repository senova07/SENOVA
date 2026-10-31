import { createContext, useContext } from 'react'
import type { CorpsInscription } from '@/services/sessionApi'
import type { Session } from '@shared/session'

export type EtatSession = 'chargement' | 'connecte' | 'anonyme'

export interface SessionContextValue {
  etat: EtatSession
  session: Session | null
  peut(permission: string): boolean
  seConnecter(email: string, motDePasse: string): Promise<void>
  sInscrire(corps: CorpsInscription): Promise<void>
  seDeconnecter(): Promise<void>
  changerOrganisation(organisationId: string): Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const valeur = useContext(SessionContext)
  if (!valeur) throw new Error('useSession doit être utilisé sous <SessionProvider>.')
  return valeur
}
