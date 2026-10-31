import type { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'

/**
 * Limiteurs de débit des routes publiques. `consume` lève `E_TOO_MANY_REQUESTS`
 * (rendue en 429 par le gestionnaire d'exceptions) au-delà du quota.
 */
const limiteConnexion = limiter.use({ requests: 5, duration: '15 mins' })
const limiteConnexionIp = limiter.use({ requests: 50, duration: '15 mins' })
const limiteInscription = limiter.use({ requests: 5, duration: '1 hour' })

const cleConnexion = (ctx: HttpContext, email: string) =>
  `connexion_${ctx.request.ip()}_${email.toLowerCase()}`

export async function limiterConnexion(ctx: HttpContext, email: string) {
  await limiteConnexionIp.consume(`connexion_ip_${ctx.request.ip()}`)
  await limiteConnexion.consume(cleConnexion(ctx, email))
}

/** Après une connexion réussie, le compteur repart de zéro. */
export async function reinitialiserConnexion(ctx: HttpContext, email: string) {
  await limiteConnexion.delete(cleConnexion(ctx, email))
}

export async function limiterInscription(ctx: HttpContext) {
  await limiteInscription.consume(`inscription_${ctx.request.ip()}`)
}
