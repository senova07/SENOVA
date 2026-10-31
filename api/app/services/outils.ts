import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/** Échappe `\`, `%` et `_` pour un motif LIKE littéral. */
export const echapperLike = (texte: string) => texte.replace(/[\\%_]/g, '\\$&')

/** Violation d'unicité MariaDB (course entre le contrôle et l'écriture). */
export const estDoublon = (erreur: unknown) => (erreur as { code?: string }).code === 'ER_DUP_ENTRY'

/** Rang suivant dans l'organisation, pour ranger un nouvel enregistrement à la suite. */
export async function prochainOrdre(
  table: string,
  organisationId: number,
  trx?: TransactionClientContract
) {
  const [ligne] = await (trx ?? db)
    .from(table)
    .where('organisation_id', organisationId)
    .max('ordre as dernier')
  return (Number(ligne?.dernier) || 0) + 1
}
