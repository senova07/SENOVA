import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export const CLE_VERSION_SESSION = 'version_session'
export const CLE_ORGANISATION = 'organisation_id'

/**
 * Authentifie la requête par la session, puis vérifie à chaque appel :
 *
 * - que le compte est toujours actif ;
 * - que la session a été ouverte avec le mot de passe en vigueur : un
 *   changement de mot de passe déconnecte les sessions ouvertes ailleurs.
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const utilisateur = await ctx.auth.authenticateUsing(['web'])

    if (!utilisateur.actif) {
      await ctx.auth.use('web').logout()
      return ctx.response.unauthorized({
        code: 'E_NON_CONNECTE',
        message: 'Votre session a expiré. Reconnectez-vous.',
      })
    }

    if (ctx.session.get(CLE_VERSION_SESSION) !== utilisateur.versionSession) {
      await ctx.auth.use('web').logout()
      return ctx.response.unauthorized({
        code: 'E_NON_CONNECTE',
        message: 'Votre session a expiré. Reconnectez-vous.',
      })
    }

    return next()
  }
}
