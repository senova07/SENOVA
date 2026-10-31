import type { HttpContext } from '@adonisjs/core/http'
import { presenterClient } from '#presenters/client'
import * as clients from '#services/clients'
import type { ClientSaisie, PageClients } from '#shared/clients'
import { archiverValidator, clientValidator, listeClientsValidator } from '#validators/client'

/** Lecture : `clients.voir` ; écriture : `clients.gerer` (voir start/routes/clients.ts). */
export default class ClientsController {
  async index({ request, organisation }: HttpContext): Promise<PageClients> {
    const filtres = await request.validateUsing(listeClientsValidator, { data: request.qs() })
    const page = await clients.listerClients(organisation.id, filtres)
    return {
      donnees: page.clients.map(presenterClient),
      total: page.total,
      page: page.page,
      parPage: page.parPage,
    }
  }

  async store({ request, response, organisation }: HttpContext) {
    const saisie: ClientSaisie = await request.validateUsing(clientValidator)
    response.status(201)
    return presenterClient(await clients.creerClient(organisation.id, saisie))
  }

  async show({ params, organisation }: HttpContext) {
    return presenterClient(await clients.ficheClient(params.id, organisation.id))
  }

  async update({ params, request, organisation }: HttpContext) {
    const saisie: ClientSaisie = await request.validateUsing(clientValidator)
    return presenterClient(await clients.modifierClient(params.id, organisation.id, saisie))
  }

  async archiver({ params, request, organisation }: HttpContext) {
    const { motif } = await request.validateUsing(archiverValidator)
    return presenterClient(await clients.archiverClient(params.id, organisation.id, motif))
  }

  async restaurer({ params, organisation }: HttpContext) {
    return presenterClient(await clients.restaurerClient(params.id, organisation.id))
  }

  async destroy({ params, response, organisation }: HttpContext) {
    await clients.supprimerClient(params.id, organisation.id)
    return response.noContent()
  }
}
