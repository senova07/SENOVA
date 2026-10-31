import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'

/**
 * Importé par le point d'entrée `bin/test.ts`.
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  apiClient(),
  sessionApiClient(app),
  authApiClient(app),
]

/**
 * La base de test est migrée une fois pour toute la campagne ; chaque test
 * travaille ensuite dans une transaction annulée à la fin.
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [() => testUtils.db().migrate()],
  teardown: [],
}

export const configureSuite: Config['configureSuite'] = (suite) => {
  // Les compteurs du limiteur (mémoire) ne fuient pas d'un test à l'autre.
  suite.onGroup((group) => group.each.setup(() => limiter.clear(['memory'])))
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
