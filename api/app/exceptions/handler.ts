import app from '@adonisjs/core/services/app'
import { errors as erreursAuth } from '@adonisjs/auth'
import { errors as erreursLimiter } from '@adonisjs/limiter'
import { errors as erreursLucid } from '@adonisjs/lucid'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

/** Code d'erreur porté par l'exception, quelle que soit sa classe. */
function codeErreur(erreur: unknown): string | undefined {
  if (typeof erreur !== 'object' || erreur === null || !('code' in erreur)) return undefined
  const code = (erreur as { code: unknown }).code
  return typeof code === 'string' ? code : undefined
}

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  /**
   * Les erreurs attendues reçoivent une réponse JSON en français, avec un code
   * stable que l'interface peut interpréter.
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof erreursAuth.E_UNAUTHORIZED_ACCESS) {
      return ctx.response.unauthorized({
        code: 'E_NON_CONNECTE',
        message: 'Votre session a expiré. Reconnectez-vous.',
      })
    }

    if (codeErreur(error) === 'E_BAD_CSRF_TOKEN') {
      return ctx.response.forbidden({
        code: 'E_CSRF',
        message: 'Requête refusée : rechargez la page et réessayez.',
      })
    }

    if (error instanceof erreursLucid.E_ROW_NOT_FOUND) {
      return ctx.response.notFound({
        code: 'E_INTROUVABLE',
        message: 'Élément introuvable.',
      })
    }

    if (error instanceof erreursLimiter.E_TOO_MANY_REQUESTS) {
      const minutes = Math.max(1, Math.ceil(error.response.availableIn / 60))
      return ctx.response
        .header('Retry-After', String(error.response.availableIn))
        .tooManyRequests({
          code: 'E_TROP_DE_REQUETES',
          message: `Trop de tentatives. Réessayez dans ${minutes} minute(s).`,
        })
    }

    // En production, aucun détail technique ne sort sur une erreur serveur.
    const statut = (error as { status?: number }).status ?? 500
    if (app.inProduction && statut >= 500) {
      ctx.logger.error({ err: error }, 'Erreur interne')
      return ctx.response.status(statut).send({
        code: 'E_INTERNE',
        message: 'Une erreur est survenue.',
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
