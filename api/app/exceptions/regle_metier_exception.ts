import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * La demande est bien formée mais contredit une règle du métier : valider un
 * chantier déjà refusé, restaurer un chantier qui n'est pas archivé…
 */
export default class RegleMetierException extends Exception {
  static status = 422
  static code = 'E_REGLE_METIER'

  constructor(message: string) {
    super(message)
  }

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({ code: error.code, message: error.message })
  }
}
