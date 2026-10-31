import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * Protection CSRF des requêtes qui modifient des données.
   *
   * L'interface lit le cookie `XSRF-TOKEN` et le renvoie dans l'en-tête
   * `X-XSRF-TOKEN`. Désactivée en test uniquement, où les requêtes ne passent
   * pas par un navigateur.
   */
  csrf: {
    enabled: !app.inTest,
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
