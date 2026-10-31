import Membre from '#models/membre'
import Organisation from '#models/organisation'
import Role from '#models/role'
import type Utilisateur from '#models/utilisateur'
import { inscrire } from '#services/organisations'

/** Outils communs aux tests fonctionnels. */

export const MOT_DE_PASSE = 'Mot-de-passe-de-test-1'

let compteur = 0

/** Compte + organisation + rôles par défaut + membre propriétaire (comme à l'inscription). */
export async function creerCompte(nomOrganisation = 'Organisation de test') {
  compteur += 1
  const utilisateur = await inscrire({
    nomComplet: `Utilisateur ${compteur}`,
    email: `u${compteur}-${Date.now()}@exemple.fr`,
    motDePasse: MOT_DE_PASSE,
    nomOrganisation,
  })
  const membre = await Membre.query().where('utilisateur_id', utilisateur.id).firstOrFail()
  const organisation = await Organisation.findOrFail(membre.organisationId)
  return { utilisateur, organisation }
}

/** Rattache un utilisateur existant à une organisation avec le rôle par défaut nommé. */
export async function ajouterMembre(
  utilisateur: Utilisateur,
  organisation: Organisation,
  nomRole: string,
  actif = true
) {
  const role = await Role.query()
    .where('organisation_id', organisation.id)
    .where('nom', nomRole)
    .firstOrFail()
  return Membre.create({
    organisationId: organisation.id,
    utilisateurId: utilisateur.id,
    roleId: role.id,
    actif,
  })
}

/** Contenu de session d'un utilisateur connecté par `loginAs` : version + organisation courante. */
export function session(utilisateur: Utilisateur, organisation?: Organisation) {
  return {
    version_session: utilisateur.versionSession,
    ...(organisation ? { organisation_id: organisation.id } : {}),
  }
}
