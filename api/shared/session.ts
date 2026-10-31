/**
 * Contrat de la session : réponse de `GET /api/auth/session`, de la connexion
 * et de l'inscription. Types purs, partagés avec l'interface.
 */

import type { Permission } from './permissions.js'

export interface UtilisateurSession {
  id: string
  email: string
  nomComplet: string
}

export interface OrganisationResume {
  id: string
  nom: string
}

export interface Organisation extends OrganisationResume {
  formeJuridique: string | null
  siren: string | null
  siret: string | null
  tvaIntracom: string | null
  adresse: string | null
  codePostal: string | null
  ville: string | null
  pays: string
  email: string | null
  telephone: string | null
}

export interface Session {
  utilisateur: UtilisateurSession
  organisation: Organisation
  organisations: OrganisationResume[]
  permissions: Permission[]
}

/** Corps de `PUT /api/organisation`. */
export type ProfilOrganisation = Omit<Organisation, 'id'>
