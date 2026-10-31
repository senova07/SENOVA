import { api } from '@/services/http'
import type { Session } from '@shared/session'

export interface CorpsInscription {
  nomComplet: string
  email: string
  motDePasse: string
  nomOrganisation: string
}

/**
 * Contrat d'authentification. Connexion et inscription ne renvoient pas de
 * forme garantie : on relit toujours `GET /auth/session`, seule source de vérité.
 */
export const apiSession = {
  courante: () => api.lire<Session>('/auth/session'),
  connexion: (email: string, motDePasse: string) =>
    api.creer<unknown>('/auth/connexion', { email, motDePasse }),
  inscription: (corps: CorpsInscription) => api.creer<unknown>('/auth/inscription', corps),
  deconnexion: () => api.creer<void>('/auth/deconnexion'),
  changerOrganisation: (organisationId: string) =>
    api.creer<unknown>('/auth/organisation', { organisationId }),
}
