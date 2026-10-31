import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AccesRefuseException from '#exceptions/acces_refuse_exception'
import { CLE_ORGANISATION } from '#middleware/auth_middleware'
import Membre from '#models/membre'
import type Organisation from '#models/organisation'
import type { Permission } from '#shared/permissions'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    /** Organisation courante (celle de la session). */
    organisation: Organisation
    /** Appartenance active de l'utilisateur à cette organisation, rôle chargé. */
    membre: Membre
    /** Permissions du rôle du membre dans l'organisation courante. */
    permissions: Permission[]
  }
}

/**
 * Résout l'organisation courante à chaque requête : l'identifiant vient de la
 * session, jamais de l'URL ni du corps. Le membre actif est relu en base, donc
 * retirer un membre ou une permission prend effet immédiatement.
 * Pas de membre actif → 403. Toujours posé après `auth`.
 */
export default class OrganisationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const utilisateur = ctx.auth.getUserOrFail()
    const organisationId = Number(ctx.session.get(CLE_ORGANISATION))

    const membre = Number.isInteger(organisationId)
      ? await Membre.query()
          .where('utilisateur_id', utilisateur.id)
          .where('organisation_id', organisationId)
          .where('actif', true)
          .preload('organisation')
          .preload('role', (requete) => requete.preload('permissions'))
          .first()
      : null

    if (!membre) {
      throw new AccesRefuseException("Vous n'êtes pas membre de cette organisation.")
    }

    ctx.membre = membre
    ctx.organisation = membre.organisation
    ctx.permissions = membre.role.permissionsAccordees
    return next()
  }
}
