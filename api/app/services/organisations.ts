import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import RegleMetierException from '#exceptions/regle_metier_exception'
import { CLE_ORGANISATION, CLE_VERSION_SESSION } from '#middleware/auth_middleware'
import Membre from '#models/membre'
import Organisation from '#models/organisation'
import Role from '#models/role'
import Utilisateur from '#models/utilisateur'
import { estDoublon } from '#services/outils'
import { ROLES_PAR_DEFAUT } from '#shared/permissions'

export interface DonneesInscription {
  nomComplet: string
  email: string
  motDePasse: string
  nomOrganisation: string
}

/**
 * Crée utilisateur, organisation, rôles par défaut et membre propriétaire,
 * le tout dans une seule transaction : tout ou rien.
 */
export async function inscrire(donnees: DonneesInscription): Promise<Utilisateur> {
  const emailPris = () => new RegleMetierException('Cette adresse e-mail est déjà utilisée.')

  return db.transaction(async (trx) => {
    if (await Utilisateur.query({ client: trx }).where('email', donnees.email).first()) {
      throw emailPris()
    }

    // Deux inscriptions simultanées passent la vérification : l'unicité en base tranche.
    let utilisateur: Utilisateur
    try {
      utilisateur = await Utilisateur.create(
        {
          email: donnees.email,
          nomComplet: donnees.nomComplet,
          motDePasse: donnees.motDePasse,
          versionSession: 1,
          actif: true,
        },
        { client: trx }
      )
    } catch (erreur) {
      if (estDoublon(erreur)) throw emailPris()
      throw erreur
    }
    const organisation = await Organisation.create(
      { nom: donnees.nomOrganisation },
      { client: trx }
    )

    let roleProprietaire: Role | undefined
    for (const definition of ROLES_PAR_DEFAUT) {
      const role = await Role.create(
        {
          organisationId: organisation.id,
          nom: definition.nom,
          description: definition.description,
          proprietaire: definition.proprietaire,
        },
        { client: trx }
      )
      if (definition.permissions.length > 0) {
        await trx
          .table('role_permissions')
          .multiInsert(
            definition.permissions.map((permission) => ({ role_id: role.id, permission }))
          )
      }
      if (definition.proprietaire) roleProprietaire = role
    }

    await Membre.create(
      {
        organisationId: organisation.id,
        utilisateurId: utilisateur.id,
        roleId: roleProprietaire!.id,
        actif: true,
      },
      { client: trx }
    )
    return utilisateur
  })
}

/** Organisations dont l'utilisateur est membre actif, de la plus ancienne appartenance à la plus récente. */
export async function organisationsDe(utilisateur: Utilisateur): Promise<Organisation[]> {
  const membres = await Membre.query()
    .where('utilisateur_id', utilisateur.id)
    .where('actif', true)
    .preload('organisation')
    .orderBy('id')
  return membres.map((membre) => membre.organisation)
}

/** Ouvre la session : connexion, version de session et première organisation. */
export async function ouvrirSession({ auth, session }: HttpContext, utilisateur: Utilisateur) {
  await auth.use('web').login(utilisateur)
  session.put(CLE_VERSION_SESSION, utilisateur.versionSession)
  const [premiere] = await organisationsDe(utilisateur)
  if (premiere) session.put(CLE_ORGANISATION, premiere.id)
  utilisateur.dernierAccesLe = DateTime.now()
  await utilisateur.save()
}
