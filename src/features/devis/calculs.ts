import type { Devis, LigneDevis, Remise, Totaux } from './types'

/** Fonctions pures : aucun accès au magasin ni à l'API. */

export const arrondir = (n: number) => Math.round(n * 100) / 100

/** Date du jour en heure locale (AAAA-MM-JJ) ; `toISOString` donnerait la date UTC. */
export const aujourdhuiIso = (): string => new Date().toLocaleDateString('sv-SE')

/** Comparaison sans casse ni accents. */
export const sansAccent = (t: string): string =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Date ISO affichée à la française (31/10/2026). */
export const dateFr = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR')

export const nouvelId = (): string => Math.random().toString(36).slice(2, 10)

export const totalLigneHt = (l: LigneDevis): number =>
  l.genre === 'article' ? arrondir(l.quantite * l.prixUnitaireHt * (1 - l.remisePourcent / 100)) : 0

/**
 * Totaux du devis ; la remise globale est répartie au prorata de chaque base de TVA, l'écart
 * d'arrondi reporté sur la dernière base pour que leur somme égale le total HT.
 */
export function calculerTotaux(
  lignes: readonly LigneDevis[],
  remise: Remise,
  acomptePourcent = 0,
): Totaux {
  const bases = new Map<number, number>()
  for (const l of lignes) {
    if (l.genre !== 'article') continue
    bases.set(l.tauxTva, (bases.get(l.tauxTva) ?? 0) + totalLigneHt(l))
  }
  const totalHtBrut = arrondir([...bases.values()].reduce((a, b) => a + b, 0))
  const brute = remise.mode === 'pourcent' ? (totalHtBrut * remise.valeur) / 100 : remise.valeur
  const remiseMontant = arrondir(Math.min(Math.max(brute, 0), totalHtBrut))
  const coef = totalHtBrut > 0 ? 1 - remiseMontant / totalHtBrut : 1
  const totalHt = arrondir(totalHtBrut - remiseMontant)
  const triees = [...bases.entries()].sort(([a], [b]) => a - b)
  let reste = totalHt
  const tva = triees.map(([taux, base], i) => {
    const baseRemisee = i === triees.length - 1 ? arrondir(reste) : arrondir(base * coef)
    reste -= baseRemisee
    return { taux, base: baseRemisee, montant: arrondir((baseRemisee * taux) / 100) }
  })
  const totalTva = arrondir(tva.reduce((a, t) => a + t.montant, 0))
  const totalTtc = arrondir(totalHt + totalTva)
  return {
    totalHtBrut,
    remiseMontant,
    totalHt,
    tva,
    totalTva,
    totalTtc,
    acompte: arrondir((totalTtc * acomptePourcent) / 100),
  }
}

/** Totaux d'un devis, avec sa remise et son acompte. */
export const totauxDevis = (d: Pick<Devis, 'lignes' | 'remise' | 'acomptePourcent'>): Totaux =>
  calculerTotaux(d.lignes, d.remise, d.acomptePourcent)

/** Sous-total HT de la section qui commence à l'index donné (jusqu'à la section suivante). */
export function sousTotalSection(lignes: readonly LigneDevis[], index: number): number {
  let total = 0
  for (const l of lignes.slice(index + 1)) {
    if (l.genre === 'section') break
    total += totalLigneHt(l)
  }
  return arrondir(total)
}

export function dateFinValidite(d: Pick<Devis, 'dateCreation' | 'validiteJours'>): string {
  const date = new Date(`${d.dateCreation}T12:00:00`)
  date.setDate(date.getDate() + d.validiteJours)
  return date.toISOString().slice(0, 10)
}

/** Borne un pourcentage saisi entre 0 et 100 (valeur invalide : 0). */
export const bornerPourcent = (n: number): number =>
  Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0

/** Déplace la ligne `id` juste avant ou après la ligne `cibleId`. Sans effet si l'un des ids est inconnu. */
export function deplacerLigne(
  lignes: readonly LigneDevis[],
  id: string,
  cibleId: string,
  apres: boolean,
): LigneDevis[] {
  const mobile = lignes.find((l) => l.id === id)
  const reste = lignes.filter((l) => l.id !== id)
  const i = reste.findIndex((l) => l.id === cibleId)
  if (!mobile || i < 0) return [...lignes]
  reste.splice(apres ? i + 1 : i, 0, mobile)
  return reste
}

/** Échange la ligne `id` avec sa voisine (-1 : monte, 1 : descend). Sans effet en bout de liste. */
export function decalerLigne(lignes: readonly LigneDevis[], id: string, delta: -1 | 1): LigneDevis[] {
  const i = lignes.findIndex((l) => l.id === id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= lignes.length) return [...lignes]
  const suite = [...lignes]
  ;[suite[i], suite[j]] = [suite[j]!, suite[i]!]
  return suite
}

/** Prochain numéro de devis, à partir des numéros existants. */
export function numeroSuivant(devis: readonly Pick<Devis, 'numero'>[]): string {
  const max = Math.max(0, ...devis.map((d) => Number(d.numero.split('-').pop()) || 0))
  return `DEV-2026-${String(max + 1).padStart(4, '0')}`
}

/** Copie d'un devis en nouveau brouillon (nouvel id, nouveau numéro, daté du jour). */
export function copierDevis(source: Devis, tous: readonly Devis[]): Devis {
  return {
    ...source,
    id: nouvelId(),
    numero: numeroSuivant(tous),
    statut: 'brouillon',
    dateCreation: aujourdhuiIso(),
    envoyeLe: undefined,
    majLe: new Date().toISOString(),
    lignes: source.lignes.map((l) => ({ ...l, id: nouvelId() })),
  }
}
