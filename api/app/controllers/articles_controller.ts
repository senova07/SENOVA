import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import RegleMetierException from '#exceptions/regle_metier_exception'
import Article from '#models/article'
import CategorieArticle from '#models/categorie_article'
import { presenterArticle } from '#presenters/article'
import { trouverDansOrganisation } from '#services/acces'
import { echapperLike, estDoublon } from '#services/outils'
import { TYPES_ARTICLE, UNITES_PAR_DEFAUT } from '#shared/articles'
import { articleValidator, favoriValidator, ordreArticlesValidator } from '#validators/article'

type Saisie = Awaited<ReturnType<typeof articleValidator.validate>>

/** Colonnes à écrire ; vérifie que catégorie et référence restent dans l'organisation. */
async function colonnes(saisie: Saisie, organisationId: number, idCourant?: number) {
  if (saisie.categorieId) {
    const categorie = await CategorieArticle.query()
      .withScopes((s) => s.deLOrganisation(organisationId))
      .where('id', saisie.categorieId)
      .first()
    if (!categorie) throw new RegleMetierException('La catégorie choisie est inconnue.')
  }
  const reference = saisie.reference || null
  if (reference) {
    const pris = Article.query()
      .withScopes((s) => s.deLOrganisation(organisationId))
      .where('reference', reference)
    if (idCourant) pris.whereNot('id', idCourant)
    if (await pris.first()) {
      throw new RegleMetierException(`La référence « ${reference} » est déjà utilisée.`)
    }
  }
  return {
    reference,
    nom: saisie.nom,
    description: saisie.description ?? '',
    type: saisie.type,
    unite: saisie.unite,
    prixUnitaireHt: saisie.prixUnitaireHt,
    tauxTva: saisie.tauxTva,
    prixAchatHt: saisie.prixAchatHt ?? null,
    categorieId: saisie.categorieId ?? null,
    ...(saisie.favori === undefined ? {} : { favori: saisie.favori }),
    ...(saisie.actif === undefined ? {} : { actif: saisie.actif }),
  }
}

/** Référence prise entre le contrôle et l'écriture (course) : même erreur métier. */
async function ecrire<T>(ecriture: () => Promise<T>) {
  try {
    return await ecriture()
  } catch (erreur) {
    if (estDoublon(erreur)) throw new RegleMetierException('Cette référence est déjà utilisée.')
    throw erreur
  }
}

/** Mémoire commerciale. Permissions : `articles.voir` / `articles.gerer` (voir routes). */
export default class ArticlesController {
  async index({ request, organisation }: HttpContext) {
    const { recherche, type, categorie, favoris, inactifs } = request.qs()
    const requete = Article.query()
      .withScopes((s) => s.deLOrganisation(organisation.id))
      .orderBy('favori', 'desc')
      .orderBy('ordre')
      .orderBy('id')

    if (inactifs !== '1') requete.where('actif', true)
    if (favoris === '1') requete.where('favori', true)
    if (typeof type === 'string' && (TYPES_ARTICLE as readonly string[]).includes(type)) {
      requete.where('type', type)
    }
    if (typeof categorie === 'string' && /^\d+$/.test(categorie)) {
      requete.where('categorie_id', Number(categorie))
    }
    if (typeof recherche === 'string' && recherche.trim()) {
      const motif = `%${echapperLike(recherche.trim())}%`
      requete.where((q) =>
        q
          .where('nom', 'like', motif)
          .orWhere('reference', 'like', motif)
          .orWhere('description', 'like', motif)
      )
    }
    const articles = await requete
    return articles.map(presenterArticle)
  }

  async show({ params, organisation }: HttpContext) {
    return presenterArticle(await trouverDansOrganisation(Article, params.id, organisation.id))
  }

  async store({ request, response, organisation }: HttpContext) {
    const saisie = await request.validateUsing(articleValidator)
    const article = await ecrire(async () =>
      Article.create({
        favori: false,
        actif: true,
        ...(await colonnes(saisie, organisation.id)),
        organisationId: organisation.id,
      })
    )
    response.status(201)
    return presenterArticle(article)
  }

  async update({ params, request, organisation }: HttpContext) {
    const article = await trouverDansOrganisation(Article, params.id, organisation.id)
    const saisie = await request.validateUsing(articleValidator)
    article.merge(await colonnes(saisie, organisation.id, article.id))
    await ecrire(() => article.save())
    return presenterArticle(article)
  }

  async destroy({ params, response, organisation }: HttpContext) {
    const article = await trouverDansOrganisation(Article, params.id, organisation.id)
    // shortcut: suppression physique, au lot devis passer en actif=false si l'article est utilisé dans un devis.
    await article.delete()
    return response.noContent()
  }

  async favori({ params, request, organisation }: HttpContext) {
    const article = await trouverDansOrganisation(Article, params.id, organisation.id)
    const { favori } = await request.validateUsing(favoriValidator)
    article.favori = favori
    await article.save()
    return presenterArticle(article)
  }

  /**
   * Les articles cités prennent les premières places dans l'ordre reçu ; les autres suivent.
   * Un seul identifiant d'une autre organisation refuse toute la demande.
   */
  async ordonner({ request, response, organisation }: HttpContext) {
    const { ids } = await request.validateUsing(ordreArticlesValidator)
    const cites = [...new Set(ids)]
    await db.transaction(async (transaction) => {
      const articles = await Article.query({ client: transaction })
        .withScopes((s) => s.deLOrganisation(organisation.id))
        .orderBy('ordre')
        .orderBy('id')
      const connus = new Map(articles.map((a) => [a.id, a]))
      if (cites.some((id) => !connus.has(id))) {
        throw new RegleMetierException('Un des articles à ranger est inconnu.')
      }
      const suite = [
        ...cites.map((id) => connus.get(id)!),
        ...articles.filter((a) => !cites.includes(a.id)),
      ]
      for (const [rang, article] of suite.entries()) {
        if (article.ordre === rang + 1) continue
        article.useTransaction(transaction)
        article.ordre = rang + 1
        await article.save()
      }
    })
    return response.noContent()
  }

  async dupliquer({ params, response, organisation }: HttpContext) {
    const source = await trouverDansOrganisation(Article, params.id, organisation.id)
    const copie = await Article.create({
      organisationId: organisation.id,
      reference: null, // unique par organisation : à renseigner par l'utilisateur
      nom: `${source.nom} (copie)`.slice(0, 200),
      description: source.description,
      type: source.type,
      unite: source.unite,
      prixUnitaireHt: source.prixUnitaireHt,
      tauxTva: source.tauxTva,
      prixAchatHt: source.prixAchatHt,
      categorieId: source.categorieId,
      favori: false,
      actif: true,
    })
    response.status(201)
    return presenterArticle(copie)
  }

  /** Unités par défaut + celles déjà saisies par l'organisation. */
  async unites({ organisation }: HttpContext) {
    const lignes = await db
      .from('articles')
      .where('organisation_id', organisation.id)
      .distinct('unite')
    const utilisees = lignes.map((l) => String(l.unite))
    return [
      ...new Set([...UNITES_PAR_DEFAUT, ...utilisees.sort((a, b) => a.localeCompare(b, 'fr'))]),
    ]
  }
}
