/**
 * Modèle de la saisie en masse : lignes éditables, normalisation des valeurs collées,
 * validation en direct et association des colonnes d'un fichier aux champs SENOVA.
 */
import { ARTICLE_TYPES, CATEGORIES, type Article, type ArticleType } from '../../data/articles'
import { normalize } from '../../lib/format'

export interface BulkRow {
  id: string
  name: string
  type: ArticleType
  reference: string
  category: string
  unit: string
  price: string
  vat: string
  purchase: string
  favorite: boolean
}

export type FieldKey = 'name' | 'type' | 'reference' | 'category' | 'unit' | 'price' | 'vat' | 'purchase' | 'favorite'
export type EditableKey = Exclude<FieldKey, 'favorite'>

export interface ColumnDef {
  key: FieldKey
  label: string
  kind: 'text' | 'select' | 'number' | 'star'
  width: number
  required?: boolean
  hideable?: boolean
  sortable?: boolean
}

export const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Nom de l’article', kind: 'text', width: 230, required: true, sortable: true },
  { key: 'type', label: 'Type', kind: 'select', width: 158, required: true, sortable: true },
  { key: 'reference', label: 'Référence', kind: 'text', width: 112, hideable: true, sortable: true },
  { key: 'category', label: 'Catégorie', kind: 'text', width: 140, hideable: true, sortable: true },
  { key: 'unit', label: 'Unité', kind: 'select', width: 104, hideable: true, sortable: true },
  { key: 'price', label: 'Prix HT', kind: 'number', width: 104, sortable: true },
  { key: 'vat', label: 'TVA', kind: 'select', width: 86, hideable: true, sortable: true },
  { key: 'purchase', label: 'Prix d’achat', kind: 'number', width: 108, hideable: true, sortable: true },
  { key: 'favorite', label: 'Favori', kind: 'star', width: 56, hideable: true },
]

export const BULK_UNITS = ['heure', 'unité', 'forfait', 'm²', 'mètre', 'jour', 'autre']
export const BULK_VATS = ['20', '10', '5.5', '0']
export const vatLabel = (v: string) => `${v.replace('.', ',')} %`
export const BULK_CATEGORIES = Array.from(new Set([...CATEGORIES, 'Robinetterie', 'Déplacement', 'Diagnostic', 'Traitement eau', 'Main-d’œuvre']))

export interface Defaults { type: ArticleType; unit: string; vat: string; category: string }
export const INITIAL_DEFAULTS: Defaults = { type: 'service', unit: 'unité', vat: '20', category: '' }

let seq = 0
export const newId = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`

export const emptyRow = (d: Defaults): BulkRow => ({
  id: newId(), name: '', type: d.type, reference: '', category: d.category, unit: d.unit,
  price: '', vat: d.vat, purchase: '', favorite: false,
})

export const isEmptyRow = (r: BulkRow) =>
  !r.name.trim() && !r.reference.trim() && !r.price.trim() && !r.purchase.trim()

/* ───── Normalisation des valeurs saisies ou collées ───── */

/** « 1 234,50 € », « 1.234,50 », « 65 » → nombre ; null si illisible. */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/[\s  €]/g, '')
  if (!s) return null
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '')
  s = s.replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  return Number(s)
}

export const formatAmount = (n: number) => n.toFixed(2).replace('.', ',')

const TYPE_ALIASES: Record<string, ArticleType> = {
  service: 'service', services: 'service', prestation: 'service',
  produit: 'produit', produits: 'produit', fourniture: 'produit', fournitures: 'produit', materiel: 'produit',
  'main-doeuvre': 'main-oeuvre', 'main doeuvre': 'main-oeuvre', 'main-d oeuvre': 'main-oeuvre', mo: 'main-oeuvre', 'main-oeuvre': 'main-oeuvre',
  deplacement: 'deplacement', deplacements: 'deplacement', transport: 'deplacement',
  abonnement: 'abonnement', abonnements: 'abonnement', contrat: 'abonnement',
  autre: 'autre', divers: 'autre',
}

export function toType(raw: string, fallback: ArticleType): ArticleType {
  const k = normalize(raw.trim()).replace(/[’']/g, '').replace(/\s+/g, ' ')
  if (!k) return fallback
  return TYPE_ALIASES[k] ?? TYPE_ALIASES[k.replace(/ /g, '-')] ?? fallback
}

/** « 20 % », « 20% », « 0,2 », « 5.5 » → '20' | '5.5'… ; la valeur brute est conservée si inconnue. */
export function toVat(raw: string): string {
  const s = raw.replace(/[\s%]/g, '').replace(',', '.')
  if (!s) return ''
  let n = Number(s)
  if (!Number.isFinite(n)) return raw.trim()
  if (n > 0 && n < 1) n = Math.round(n * 1000) / 10
  const str = String(n)
  return BULK_VATS.includes(str) ? str : raw.trim()
}

const UNIT_ALIASES: Record<string, string> = {
  h: 'heure', heure: 'heure', heures: 'heure', hr: 'heure',
  u: 'unité', unite: 'unité', unites: 'unité', pce: 'unité', piece: 'unité', pieces: 'unité', ens: 'unité',
  forfait: 'forfait', ft: 'forfait', fft: 'forfait', f: 'forfait',
  m2: 'm²', 'm²': 'm²',
  m: 'mètre', ml: 'mètre', metre: 'mètre', metres: 'mètre',
  j: 'jour', jour: 'jour', jours: 'jour',
}
export function toUnit(raw: string, fallback: string): string {
  const k = normalize(raw.trim()).replace(/\.$/, '')
  if (!k) return fallback
  return UNIT_ALIASES[k] ?? raw.trim()
}

export const toFavorite = (raw: string) => /^(oui|yes|true|1|x|★|vrai)$/i.test(raw.trim())

/** Applique une valeur texte (collée, importée) à un champ en la normalisant. */
export function assignField(row: BulkRow, key: FieldKey, raw: string, d: Defaults): BulkRow {
  switch (key) {
    case 'type': return { ...row, type: toType(raw, row.type ?? d.type) }
    case 'vat': return { ...row, vat: toVat(raw) || row.vat }
    case 'unit': return { ...row, unit: toUnit(raw, row.unit) }
    case 'favorite': return { ...row, favorite: toFavorite(raw) }
    case 'price':
    case 'purchase': {
      const n = parseAmount(raw)
      return { ...row, [key]: n == null ? raw.trim() : formatAmount(n) }
    }
    default: return { ...row, [key]: raw.trim() }
  }
}

/* ───── Validation ───── */

export type RowErrors = Partial<Record<FieldKey, string>>

export function validateRows(rows: BulkRow[], catalogue: Article[]): Map<string, RowErrors> {
  const out = new Map<string, RowErrors>()
  const existing = new Set(catalogue.map((a) => a.reference.trim().toUpperCase()))
  const counts = new Map<string, number>()
  for (const r of rows) {
    if (isEmptyRow(r)) continue
    const ref = r.reference.trim().toUpperCase()
    if (ref) counts.set(ref, (counts.get(ref) ?? 0) + 1)
  }
  for (const r of rows) {
    if (isEmptyRow(r)) continue
    const e: RowErrors = {}
    if (!r.name.trim()) e.name = 'Nom obligatoire'
    if (!r.price.trim()) e.price = 'Prix obligatoire'
    else if (parseAmount(r.price) == null) e.price = 'Prix incorrect'
    if (r.purchase.trim() && parseAmount(r.purchase) == null) e.purchase = 'Prix incorrect'
    if (!BULK_VATS.includes(r.vat)) e.vat = 'TVA invalide'
    const ref = r.reference.trim().toUpperCase()
    if (ref && (counts.get(ref) ?? 0) > 1) e.reference = 'Référence en double'
    else if (ref && existing.has(ref)) e.reference = 'Déjà dans le catalogue'
    if (Object.keys(e).length) out.set(r.id, e)
  }
  return out
}

/** Transforme les lignes valides en articles du catalogue (référence générée si vide). */
export function toArticles(rows: BulkRow[], catalogue: Article[]): Article[] {
  const used = new Set(catalogue.map((a) => a.reference.toUpperCase()))
  rows.forEach((r) => r.reference.trim() && used.add(r.reference.trim().toUpperCase()))
  return rows.map((r, i) => {
    let reference = r.reference.trim()
    if (!reference) {
      const prefix = ARTICLE_TYPES.find((t) => t.id === r.type)!.refPrefix
      let n = 1
      while (used.has(`${prefix}-${String(n).padStart(3, '0')}`)) n++
      reference = `${prefix}-${String(n).padStart(3, '0')}`
      used.add(reference)
    }
    const purchase = parseAmount(r.purchase)
    return {
      id: `imp-${Date.now()}-${i}`,
      name: r.name.trim(),
      type: r.type,
      reference,
      unit: r.unit === 'autre' ? 'unité' : r.unit,
      priceHT: parseAmount(r.price)!,
      vatRate: Number(r.vat),
      purchasePrice: purchase ?? undefined,
      category: r.category.trim() || undefined,
      favorite: r.favorite,
      lastUsedAt: null,
    }
  })
}

/* ───── Lecture de fichiers tabulaires et association des colonnes ───── */

/** CSV / TSV / texte collé : détecte le séparateur et gère les guillemets. */
export function parseDelimited(text: string): string[][] {
  const clean = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (!clean.trim()) return []
  const first = clean.split('\n')[0]
  const sep = ['\t', ';', ','].map((s) => [s, first.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (q) {
      if (c === '"' && clean[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"' && cell === '') q = true
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  row.push(cell); rows.push(row)
  return rows.filter((r) => r.some((c) => c.trim()))
}

/** Découpe un collage Excel en cellules (tabulations + retours à la ligne). */
export const parseClipboard = (text: string) =>
  text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n').map((l) => l.split('\t'))

const SYNONYMS: Record<FieldKey, string[]> = {
  name: ['nom', 'designation', 'libelle', 'article', 'intitule', 'produit', 'description courte', 'nom de larticle'],
  type: ['type', 'nature', 'genre'],
  reference: ['reference', 'ref', 'code', 'code article', 'sku', 'ref interne'],
  category: ['categorie', 'famille', 'rayon', 'groupe', 'gamme'],
  unit: ['unite', 'u', 'conditionnement', 'unite de vente'],
  price: ['prix ht', 'pu ht', 'prix unitaire ht', 'prix de vente', 'prix', 'pu', 'tarif', 'prix vente ht'],
  vat: ['tva', 'taux tva', 'taux de tva', 'tx tva'],
  purchase: ['prix dachat', 'prix achat', 'pa ht', 'cout', 'prix de revient', 'achat ht'],
  favorite: ['favori', 'favoris'],
}

/** Devine le champ SENOVA correspondant à un en-tête de colonne. */
export function guessField(header: string): FieldKey | null {
  const h = normalize(header).replace(/[’'.]/g, '').replace(/\s+/g, ' ').trim()
  if (!h) return null
  for (const [key, list] of Object.entries(SYNONYMS) as [FieldKey, string[]][]) {
    if (list.includes(h)) return key
  }
  for (const [key, list] of Object.entries(SYNONYMS) as [FieldKey, string[]][]) {
    if (list.some((s) => s.length > 2 && h.includes(s))) return key
  }
  return null
}

/** La première ligne ressemble-t-elle à des en-têtes ? (au moins deux colonnes reconnues, aucune valeur numérique) */
export function looksLikeHeader(row: string[]) {
  const known = row.filter((c) => guessField(c)).length
  const numeric = row.filter((c) => parseAmount(c) != null).length
  return known >= 2 && numeric === 0
}

export const FIELD_LABELS: Record<FieldKey, string> = Object.fromEntries(COLUMNS.map((c) => [c.key, c.label])) as Record<FieldKey, string>
