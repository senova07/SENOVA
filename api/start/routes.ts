/*
|--------------------------------------------------------------------------
| Routes de l'API
|--------------------------------------------------------------------------
|
| Toutes les routes sont préfixées par /api. Hormis l'inscription et la
| connexion, chacune exige une session valide (`auth`) ; les routes métier
| exigent en plus une organisation courante (`organisation`) puis les
| permissions de l'action (`permission`) : l'interface masque, le serveur
| interdit.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const OrganisationController = () => import('#controllers/organisation_controller')
import routesArticles from '#start/routes/articles'
import { routesClients } from '#start/routes/clients'

router
  .group(() => {
    /* -------------------------------------------------------- Publiques */

    router.post('auth/inscription', [AuthController, 'inscription'])
    router.post('auth/connexion', [AuthController, 'connexion'])
    router.post('auth/deconnexion', [AuthController, 'deconnexion'])

    /* ----------------------------------------------------- Authentifiées */

    router
      .group(() => {
        // Choisit l'organisation courante : vérifie lui-même l'appartenance.
        router.post('auth/organisation', [AuthController, 'changerOrganisation'])

        /* ------------------------------ Dans une organisation (membre actif) */

        router
          .group(() => {
            router.get('auth/session', [AuthController, 'session'])
            router.get('organisation', [OrganisationController, 'show'])
            router
              .put('organisation', [OrganisationController, 'update'])
              .use(middleware.permission({ toutes: ['organisation.gerer'] }))
            routesArticles()
            routesClients()
          })
          .use(middleware.organisation())
      })
      .use(middleware.auth())
  })
  .prefix('/api')
