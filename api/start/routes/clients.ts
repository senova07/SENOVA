import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ClientsController = () => import('#controllers/clients_controller')

/** À appeler dans le groupe `/api` authentifié + `organisation`. */
export function routesClients() {
  router
    .group(() => {
      router
        .group(() => {
          router.get('/', [ClientsController, 'index'])
          router.get('/:id', [ClientsController, 'show'])
        })
        .use(middleware.permission({ toutes: ['clients.voir'] }))

      router
        .group(() => {
          router.post('/', [ClientsController, 'store'])
          router.put('/:id', [ClientsController, 'update'])
          router.post('/:id/archiver', [ClientsController, 'archiver'])
          router.post('/:id/restaurer', [ClientsController, 'restaurer'])
          router.delete('/:id', [ClientsController, 'destroy'])
        })
        .use(middleware.permission({ toutes: ['clients.gerer'] }))
    })
    .prefix('clients')
}
