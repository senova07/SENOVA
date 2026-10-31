import type { HttpContext } from '@adonisjs/core/http'
import { presenterOrganisation } from '#presenters/session'
import { profilOrganisationValidator } from '#validators/organisation'

/** Profil de l'entreprise courante. PUT exige `organisation.gerer` (voir routes). */
export default class OrganisationController {
  async show({ organisation }: HttpContext) {
    return presenterOrganisation(organisation)
  }

  async update({ request, organisation }: HttpContext) {
    const donnees = await request.validateUsing(profilOrganisationValidator)
    organisation.merge(donnees)
    await organisation.save()
    return presenterOrganisation(organisation)
  }
}
