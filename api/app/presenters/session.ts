import type Organisation from '#models/organisation'
import type Utilisateur from '#models/utilisateur'
import type { Permission } from '#shared/permissions'
import type { Organisation as OrganisationDto, Session } from '#shared/session'

/** Ids exposés en chaîne : l'interface ne manipule jamais d'entier brut. */
export function presenterOrganisation(organisation: Organisation): OrganisationDto {
  return {
    id: String(organisation.id),
    nom: organisation.nom,
    formeJuridique: organisation.formeJuridique,
    siren: organisation.siren,
    siret: organisation.siret,
    tvaIntracom: organisation.tvaIntracom,
    adresse: organisation.adresse,
    codePostal: organisation.codePostal,
    ville: organisation.ville,
    pays: organisation.pays,
    email: organisation.email,
    telephone: organisation.telephone,
  }
}

export function presenterSession(
  utilisateur: Utilisateur,
  organisation: Organisation,
  organisations: Organisation[],
  permissions: Permission[]
): Session {
  return {
    utilisateur: {
      id: String(utilisateur.id),
      email: utilisateur.email,
      nomComplet: utilisateur.nomComplet,
    },
    organisation: presenterOrganisation(organisation),
    organisations: organisations.map((o) => ({ id: String(o.id), nom: o.nom })),
    permissions,
  }
}
