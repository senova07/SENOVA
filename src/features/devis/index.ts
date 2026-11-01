/** API publique de la feature devis : types, données de démo et fonctions pures. Seul point d'import autorisé depuis une autre feature. */
export { aujourdhuiIso, dateFinValidite, totalTtcDevis, totauxDevis } from './calculs'
export { FACTURES_DEMO, PRESTATIONS_DU_JOUR } from './demo'
export type { FactureDemo, PrestationDemo } from './demo'
export { magasinDevis } from './magasin'
export { ICONE_STATUT_DEVIS, LIBELLES_STATUT_DEVIS } from './statuts'
export type { Devis, StatutDevis } from './types'
export { reinitialiserDemoDevis } from './api'
