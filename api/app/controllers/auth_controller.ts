import { errors as erreursAuth } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import AccesRefuseException from '#exceptions/acces_refuse_exception'
import RegleMetierException from '#exceptions/regle_metier_exception'
import { CLE_ORGANISATION } from '#middleware/auth_middleware'
import Membre from '#models/membre'
import Utilisateur from '#models/utilisateur'
import { presenterSession } from '#presenters/session'
import { identifiant } from '#services/acces'
import { limiterConnexion, limiterInscription, reinitialiserConnexion } from '#services/limites'
import { inscrire, organisationsDe, ouvrirSession } from '#services/organisations'
import {
  changerOrganisationValidator,
  connexionValidator,
  inscriptionValidator,
} from '#validators/auth'

export default class AuthController {
  async inscription(ctx: HttpContext) {
    await limiterInscription(ctx)
    const donnees = await ctx.request.validateUsing(inscriptionValidator)
    const utilisateur = await inscrire(donnees)
    await ouvrirSession(ctx, utilisateur)
    ctx.response.status(201)
    return this.#session(utilisateur, ctx)
  }

  async connexion(ctx: HttpContext) {
    const { email, motDePasse } = await ctx.request.validateUsing(connexionValidator)
    await limiterConnexion(ctx, email)

    // Même réponse pour un compte inconnu, un mauvais mot de passe ou un compte
    // désactivé : on n'apprend rien sur l'existence d'un compte.
    const refus = () =>
      ctx.response.badRequest({
        code: 'E_IDENTIFIANTS_INVALIDES',
        message: 'E-mail ou mot de passe incorrect.',
      })

    let utilisateur: Utilisateur
    try {
      utilisateur = await Utilisateur.verifyCredentials(email, motDePasse)
    } catch (erreur) {
      if (erreur instanceof erreursAuth.E_INVALID_CREDENTIALS) return refus()
      throw erreur
    }
    if (!utilisateur.actif) return refus()

    await reinitialiserConnexion(ctx, email)
    const organisations = await organisationsDe(utilisateur)
    if (organisations.length === 0) {
      throw new RegleMetierException("Votre compte n'est rattaché à aucune entreprise active.")
    }
    await ouvrirSession(ctx, utilisateur)
    return this.#session(utilisateur, ctx)
  }

  async deconnexion({ auth, session }: HttpContext) {
    await auth.use('web').logout()
    session.clear()
    return { deconnecte: true }
  }

  /** Suppose les middlewares `auth` puis `organisation`. */
  async session({ auth, organisation, permissions }: HttpContext) {
    const utilisateur = auth.getUserOrFail()
    return presenterSession(
      utilisateur,
      organisation,
      await organisationsDe(utilisateur),
      permissions
    )
  }

  /** Suppose le middleware `auth` : l'appartenance est vérifiée ici, avant de changer de contexte. */
  async changerOrganisation(ctx: HttpContext) {
    const utilisateur = ctx.auth.getUserOrFail()
    const { organisationId } = await ctx.request.validateUsing(changerOrganisationValidator)

    const membre = await Membre.query()
      .where('utilisateur_id', utilisateur.id)
      .where('organisation_id', Number(organisationId) || 0)
      .where('actif', true)
      .first()
    if (!membre) throw new AccesRefuseException("Vous n'êtes pas membre de cette organisation.")

    ctx.session.put(CLE_ORGANISATION, membre.organisationId)
    return this.#session(utilisateur, ctx)
  }

  /** Session complète pour l'organisation inscrite en session (sans repasser par le middleware). */
  async #session(utilisateur: Utilisateur, { session }: HttpContext) {
    const membre = await Membre.query()
      .where('utilisateur_id', utilisateur.id)
      .where('organisation_id', identifiant(session.get(CLE_ORGANISATION)))
      .where('actif', true)
      .preload('organisation')
      .preload('role', (requete) => requete.preload('permissions'))
      .firstOrFail()
    return presenterSession(
      utilisateur,
      membre.organisation,
      await organisationsDe(utilisateur),
      membre.role.permissionsAccordees
    )
  }
}
