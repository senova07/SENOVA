import { dateFinValidite } from '@/features/devis/calculs'
import type { Devis } from '@/features/devis/types'

/** Devis à traiter : brouillons, plus les envoyés dont la validité est dépassée. */
export function devisATraiter(devis: readonly Devis[], aujourdhui: string): number {
  return devis.filter(
    (d) =>
      d.statut === 'brouillon' ||
      d.statut === 'expire' ||
      (d.statut === 'envoye' && dateFinValidite(d) < aujourdhui),
  ).length
}

