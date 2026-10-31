import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * L'utilisateur est connecté, mais son rôle ne l'autorise pas à cette action.
 */
export default class AccesRefuseException extends Exception {
  static status = 403
  static code = 'E_ACCES_REFUSE'

  constructor(message = "Vous n'avez pas la permission d'effectuer cette action.") {
    super(message)
  }

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({ code: error.code, message: error.message })
  }
}
