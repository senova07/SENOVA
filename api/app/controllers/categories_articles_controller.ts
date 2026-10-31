import type { HttpContext } from '@adonisjs/core/http'
import RegleMetierException from '#exceptions/regle_metier_exception'
import CategorieArticle from '#models/categorie_article'
import { presenterCategorie } from '#presenters/article'
import { trouverDansOrganisation } from '#services/acces'
import { estDoublon } from '#services/outils'
import { categorieValidator } from '#validators/article'

const dejaExistante = (nom: string) =>
  new RegleMetierException(`La catégorie « ${nom} » existe déjà.`)

/** Unicité du nom par organisation, insensible à la casse (collation MariaDB + contrôle explicite). */
async function verifierNomLibre(nom: string, organisationId: number, idCourant?: number) {
  const requete = CategorieArticle.query()
    .withScopes((s) => s.deLOrganisation(organisationId))
    .whereRaw('LOWER(nom) = ?', [nom.toLowerCase()])
  if (idCourant) requete.whereNot('id', idCourant)
  if (await requete.first()) {
    throw dejaExistante(nom)
  }
}

export default class CategoriesArticlesController {
  async index({ organisation }: HttpContext) {
    const categories = await CategorieArticle.query()
      .withScopes((s) => s.deLOrganisation(organisation.id))
      .orderBy('ordre')
      .orderBy('nom')
    return categories.map(presenterCategorie)
  }

  async store({ request, response, organisation }: HttpContext) {
    const { nom } = await request.validateUsing(categorieValidator)
    await verifierNomLibre(nom, organisation.id)
    const categorie = await CategorieArticle.create({ nom, organisationId: organisation.id }).catch(
      (erreur) => {
        throw estDoublon(erreur) ? dejaExistante(nom) : erreur
      }
    )
    response.status(201)
    return presenterCategorie(categorie)
  }

  async update({ params, request, organisation }: HttpContext) {
    const categorie = await trouverDansOrganisation(CategorieArticle, params.id, organisation.id)
    const { nom } = await request.validateUsing(categorieValidator)
    await verifierNomLibre(nom, organisation.id, categorie.id)
    categorie.nom = nom
    await categorie.save().catch((erreur) => {
      throw estDoublon(erreur) ? dejaExistante(nom) : erreur
    })
    return presenterCategorie(categorie)
  }

  /** Les articles de la catégorie restent, sans catégorie (FK ON DELETE SET NULL). */
  async destroy({ params, response, organisation }: HttpContext) {
    const categorie = await trouverDansOrganisation(CategorieArticle, params.id, organisation.id)
    await categorie.delete()
    return response.noContent()
  }
}
