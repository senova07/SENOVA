import { configApp } from '@adonisjs/eslint-config'

export default [
  ...configApp(),
  {
    files: ['tests/**/*.ts'],
    rules: {
      // `(await client.get(...)).assertStatus(200)` est la forme lisible d'un
      // test Japa : on ne la découpe pas en deux lignes pour la règle.
      '@unicorn/no-await-expression-member': 'off',
    },
  },
]
