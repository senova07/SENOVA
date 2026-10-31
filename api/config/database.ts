import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

/**
 * MariaDB / MySQL uniquement. Les tests tournent sur la base `<DB_DATABASE>_test`
 * (créée par docker/init.sql) : jamais sur les données de développement.
 */
const dbConfig = defineConfig({
  connection: 'mysql',

  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('MYSQL_HOST', '127.0.0.1'),
        port: env.get('MYSQL_PORT', 3306),
        user: env.get('MYSQL_USER'),
        password: env.get('MYSQL_PASSWORD')?.release(),
        database: app.inTest ? `${env.get('DB_DATABASE')}_test` : env.get('DB_DATABASE'),
        dateStrings: ['DATE'],
      },
      migrations: { naturalSort: true, paths: ['database/migrations'] },
      seeders: { paths: ['database/seeders'] },
      /** Les modèles déclarent leurs colonnes eux-mêmes. */
      schemaGeneration: { enabled: false },
      debug: false,
    },
  },
})

export default dbConfig
