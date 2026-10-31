import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/limiter'

/** Compteurs dans Redis ; les tests utilisent la mémoire. */
const limiterConfig = defineConfig({
  default: app.inTest ? 'memory' : 'redis',
  stores: {
    redis: stores.redis({}),
    memory: stores.memory({}),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
