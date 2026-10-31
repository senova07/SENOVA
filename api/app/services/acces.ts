import type { LucidModel } from '@adonisjs/lucid/types/model'
import IntrouvableException from '#exceptions/introuvable_exception'

/**
 * Accès aux données en respectant l'isolation entre organisations.
 *
 * PATTERN À SUIVRE PAR TOUS LES MODULES MÉTIER (clients, articles, devis…) :
 *
 * - le modèle porte `organisationId` (colonne `organisation_id`) ;
 * - listes : `Modele.query().withScopes((s) => s.deLOrganisation(ctx.organisation.id))`
 *   (scope défini dans #models/portee, à déclarer en `static deLOrganisation`) ;
 * - lecture d'un objet par identifiant d'URL :
 *   `await trouverDansOrganisation(Client, params.id, ctx.organisation.id)` ;
 * - création : l'`organisationId` vient de `ctx.organisation.id`, jamais du corps.
 *
 * Un objet d'une autre organisation répond 404, exactement comme un objet
 * inexistant : un identifiant deviné ne révèle rien.
 */

/** Identifiant d'URL converti en entier ; tout le reste est introuvable. */
export function identifiant(valeur: string | number | undefined): number {
  const nombre = Number(valeur)
  if (!Number.isInteger(nombre) || nombre <= 0) throw new IntrouvableException()
  return nombre
}

export async function trouverDansOrganisation<M extends LucidModel>(
  modele: M,
  id: string | number | undefined,
  organisationId: number
): Promise<InstanceType<M>> {
  const ligne = await modele
    .query()
    .where('id', identifiant(id))
    .where('organisation_id', organisationId)
    .first()
  if (!ligne) throw new IntrouvableException()
  return ligne as InstanceType<M>
}
