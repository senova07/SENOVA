import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,

  cookieName: 'senova_session',

  clearWithBrowser: false,

  /** La session expire après douze heures d'inactivité. */
  age: '12h',

  cookie: {
    path: '/',
    /** Le cookie de session n'est jamais lisible par le JavaScript de la page. */
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },

  // Les tests lisent et écrivent la session directement : magasin mémoire.
  store: app.inTest ? 'memory' : env.get('SESSION_DRIVER'),

  stores: {
    redis: stores.redis({ connection: 'main' }),
  },
})

export default sessionConfig
