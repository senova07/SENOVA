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
