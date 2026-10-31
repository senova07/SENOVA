import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AccesRefuseException from '#exceptions/acces_refuse_exception'
import type { Permission } from '#shared/permissions'

export interface OptionsPermission {
  /** Permissions toutes exigées. */
  toutes?: Permission[]
  /** Au moins une de ces permissions. */
  une?: Permission[]
}

/**
 * Garde de route : refuse avec un 403 si le rôle du membre, dans
 * l'organisation courante, ne porte pas les permissions demandées. Toujours
 * posé après `organisation`.
 *
 * C'est la protection qui compte : masquer un bouton dans l'interface n'empêche
 * personne d'appeler l'API directement.
 */
export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: OptionsPermission) {
    const toutes = options.toutes ?? []
    const une = options.une ?? []

    if (!toutes.every((permission) => ctx.permissions.includes(permission))) {
      throw new AccesRefuseException()
    }
    if (une.length > 0 && !une.some((permission) => ctx.permissions.includes(permission))) {
      throw new AccesRefuseException()
    }

    return next()
  }
}
