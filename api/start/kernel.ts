/*
|--------------------------------------------------------------------------
| Noyau HTTP
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

/**
 * Middleware exécutés sur toutes les requêtes, même sans route.
 */
server.use([
  () => import('#middleware/force_json_response_middleware'),
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * Middleware exécutés sur toutes les requêtes qui ont une route.
 */
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

/**
 * Middleware nommés, posés route par route.
 *
 * - `auth` : session valide et compte actif ;
 * - `organisation` : membre actif de l'organisation courante (après auth) ;
 * - `permission` : 403 si le rôle n'a pas les permissions demandées (après organisation).
 */
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  organisation: () => import('#middleware/organisation_middleware'),
  permission: () => import('#middleware/permission_middleware'),
})
