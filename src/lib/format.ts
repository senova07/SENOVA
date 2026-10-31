/** Formatage français partagé (montants, taux) et lecture des saisies décimales. */

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export const formaterEuro = (montant: number): string => euro.format(montant)

export const formaterTaux = (taux: number): string => `${nombre.format(taux)} %`

/** Lit « 12,5 » ou « 12.5 » ; renvoie null si la saisie n'est pas un nombre. */
export function lireDecimal(saisie: string): number | null {
  const texte = saisie.trim().replace(/\s/g, '').replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(texte) ? Number(texte) : null
}

/**
 * Date ou horodatage ISO affiché à la française (31/10/2026).
 * Une date seule (« 2026-10-24 ») est lue à midi local : `new Date` la lirait en UTC,
 * et elle s'afficherait la veille sur un poste en UTC négatif (Antilles, Guyane).
 */
export const formaterDate = (iso: string): string =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-FR')
