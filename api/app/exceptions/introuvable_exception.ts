import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Élément inexistant — ou existant mais hors de portée de l'utilisateur.
 *
 * Les deux cas répondent pareil : un commercial qui tape l'adresse de la
 * fiche d'un collègue n'apprend même pas qu'elle existe.
 */
export default class IntrouvableException extends Exception {
  static status = 404
  static code = 'E_INTROUVABLE'

  constructor(message = 'Élément introuvable.') {
    super(message)
  }

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({ code: error.code, message: error.message })
  }
}
