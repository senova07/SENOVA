/*
|--------------------------------------------------------------------------
| Variables d'environnement
|--------------------------------------------------------------------------
|
| Toute variable lue par l'application est déclarée et validée ici. Les
| secrets (APP_KEY, mot de passe de base) ne figurent jamais dans le code.
|
*/

import { Env } from '@adonisjs/core/env'

const env = await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // Application
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  APP_NAME: Env.schema.string.optional(),

  // IP/sous-réseau du reverse proxy Caddy, séparés par des virgules (défaut : loopback).
  // Celui-ci doit écrire X-Forwarded-For, jamais le relayer tel quel.
  TRUST_PROXY: Env.schema.string.optional(),

  // Session
  SESSION_DRIVER: Env.schema.enum(['redis', 'memory'] as const),

  // Base de données MariaDB / MySQL
  DB_CONNECTION: Env.schema.enum.optional(['mysql'] as const),
  MYSQL_HOST: Env.schema.string({ format: 'host' }),
  MYSQL_PORT: Env.schema.number(),
  MYSQL_USER: Env.schema.string(),
  MYSQL_PASSWORD: Env.schema.secret.optional(),
  DB_DATABASE: Env.schema.string(),

  // Redis : sessions et limiteur de débit
  REDIS_HOST: Env.schema.string.optional({ format: 'host' }),
  REDIS_PORT: Env.schema.number.optional(),
  REDIS_PASSWORD: Env.schema.secret.optional(),

  // URL de l'interface (origine CORS en développement)
  FRONT_URL: Env.schema.string.optional({ format: 'url', tld: false }),

  // Mot de passe des comptes de démonstration créés par les seeders
  SEED_MOT_DE_PASSE: Env.schema.secret.optional(),
})

// Sessions en mémoire : perdues au redémarrage et non partagées entre processus.
if (env.get('NODE_ENV') === 'production' && env.get('SESSION_DRIVER') === 'memory') {
  throw new Error('SESSION_DRIVER=memory est interdit en production : utiliser redis.')
}

export default env
