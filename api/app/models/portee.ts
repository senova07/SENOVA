import { scope } from '@adonisjs/lucid/orm'

/**
 * PORTÉE MULTI-ORGANISATION — à réutiliser par tout modèle métier.
 *
 * Règle : toute table métier porte `organisation_id`, et toute requête sur
 * elle est filtrée par l'organisation courante (`ctx.organisation.id`, posée
 * par le middleware `organisation`). Jamais de `Modele.find(id)` nu.
 *
 * Deux outils, au choix selon le besoin :
 *
 * 1. Le scope Lucid `deLOrganisation` pour les listes et requêtes :
 *      // dans le modèle :  static deLOrganisation = deLOrganisation
 *      const clients = await Client.query()
 *        .withScopes((s) => s.deLOrganisation(ctx.organisation.id))
 *        .orderBy('nom')
 *
 * 2. `trouverDansOrganisation` (#services/acces) pour lire UN objet par
 *    identifiant d'URL : 404 identique que l'objet n'existe pas ou appartienne
 *    à une autre organisation, donc aucune fuite par identifiant deviné :
 *      const client = await trouverDansOrganisation(Client, params.id, ctx.organisation.id)
 *
 * À la création, l'organisation vient toujours du contexte, jamais du corps de
 * la requête : `Client.create({ ...donnees, organisationId: ctx.organisation.id })`.
 */
export const deLOrganisation = scope((requete, organisationId: number) => {
  requete.where('organisation_id', organisationId)
})
