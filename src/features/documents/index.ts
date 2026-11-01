/** API publique de la feature documents : rendu autonome + charte appliquée. Seul point d'import autorisé depuis une autre feature. */
export * from './rendu'
export { apiCharte, apiReglagesDocuments, useCharteAppliquee, useReglagesDocuments, REGLAGES_PAR_DEFAUT, reinitialiserDemoDocuments } from './api'
export type { ReglagesDocuments } from './api'
