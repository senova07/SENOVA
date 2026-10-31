import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/cors'

/**
 * En production, l'interface et l'API partagent la même origine (proxy
 * inverse) : aucune origine tierce n'est autorisée. En développement, Vite
 * relaie `/api` vers le serveur ; seule l'origine de l'interface (FRONT_URL) est admise.
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: app.inDev ? [env.get('FRONT_URL', 'http://localhost:5173')] : [],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
