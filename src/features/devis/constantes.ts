import { TAUX_TVA } from '@shared/articles'

/** Taux de TVA proposés sur une ligne (les mêmes que le catalogue). */
export const TAUX_TVA_LIGNE: readonly number[] = TAUX_TVA
export const DUREES_VALIDITE = [15, 30, 45, 60, 90] as const
export const ACOMPTES_USUELS = [0, 20, 30, 40, 50] as const

export const CONDITIONS_PAIEMENT = [
  'Acompte à la commande, solde à réception de facture',
  'Paiement à réception de facture',
  'Paiement à 30 jours',
  'Paiement comptant à la fin des travaux',
] as const

export const MOYENS_PAIEMENT = ['Virement bancaire', 'Chèque', 'Carte bancaire', 'Espèces'] as const
