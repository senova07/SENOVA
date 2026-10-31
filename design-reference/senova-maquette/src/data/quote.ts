/**
 * Données d'exemple pour la création de devis et l'apparence des documents.
 * Tout est local : aucune donnée n'est envoyée.
 */

export interface Client {
  id: string
  civility: string
  name: string
  email: string
  phone: string
  address: string
  zip: string
  city: string
}

export interface Address { address: string; zip: string; city: string }

export type LineKind = 'item' | 'section' | 'text'

export interface QuoteLine {
  id: string
  kind: LineKind
  label: string
  reference?: string
  qty: number
  unit: string
  price: number
  vat: number
  discount: number
}

export interface Quote {
  number: string
  date: string
  validityDays: number
  object: string
  clientId: string | null
  siteDifferent: boolean
  site: Address
  lines: QuoteLine[]
  depositPct: number
  paymentTerms: string
  paymentMethods: string[]
  notes: string
}

export interface Company {
  name: string
  activity: string
  address: string
  zip: string
  city: string
  phone: string
  email: string
  website: string
}

export const COMPANY: Company = {
  name: 'Atelier Martin',
  activity: 'Plomberie · Chauffage',
  address: '12 rue des Artisans',
  zip: '69003',
  city: 'Lyon',
  phone: '04 78 12 34 56',
  email: 'contact@atelier-martin.fr',
  website: 'atelier-martin.fr',
}

export const CLIENTS: Client[] = [
  { id: 'c1', civility: 'Mme', name: 'Sophie Durand', email: 'sophie.durand@email.fr', phone: '06 12 34 56 78', address: '8 rue Paul Bert', zip: '69003', city: 'Lyon' },
  { id: 'c2', civility: 'M.', name: 'Karim Benali', email: 'k.benali@email.fr', phone: '06 45 22 18 90', address: '27 avenue Jean Jaurès', zip: '69007', city: 'Lyon' },
  { id: 'c3', civility: '', name: 'SCI Les Tilleuls', email: 'gestion@sci-tilleuls.fr', phone: '04 72 40 11 22', address: '3 place Bellecour', zip: '69002', city: 'Lyon' },
  { id: 'c4', civility: 'Mme', name: 'Claire Moreau', email: 'claire.moreau@email.fr', phone: '07 81 03 44 12', address: '14 chemin des Vignes', zip: '69130', city: 'Écully' },
]

export const UNITS = ['heure', 'forfait', 'pièce', 'unité', 'm²', 'mètre', 'jour', 'lot']
export const VATS = [20, 10, 5.5, 0]
export const VALIDITIES = [15, 30, 45, 60, 90]
export const PAYMENT_TERMS = [
  'Acompte à la commande, solde à réception de facture',
  'Paiement à réception de facture',
  'Paiement à 30 jours',
  'Paiement comptant à la fin des travaux',
]
export const PAYMENT_METHODS = ['Virement bancaire', 'Chèque', 'Carte bancaire', 'Espèces']

let n = 0
export const lineId = () => `l${Date.now().toString(36)}${(n++).toString(36)}`

const item = (label: string, qty: number, unit: string, price: number, vat: number, reference = '', discount = 0): QuoteLine =>
  ({ id: lineId(), kind: 'item', label, reference, qty, unit, price, vat, discount })
const section = (label: string): QuoteLine => ({ id: lineId(), kind: 'section', label, qty: 0, unit: '', price: 0, vat: 0, discount: 0 })

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const initialQuote = (): Quote => ({
  number: 'DEV-2026-0042',
  date: today(),
  validityDays: 30,
  object: 'Rénovation salle de bain',
  clientId: 'c1',
  siteDifferent: true,
  site: { address: '12 rue des Écoles', zip: '69003', city: 'Lyon' },
  lines: [
    section('Salle de bain'),
    item('Dépose ancienne installation', 1, 'forfait', 150, 10, 'SERV-030'),
    item('Mitigeur thermostatique Grohe', 1, 'pièce', 189, 20, 'PR-014'),
    item('Pose lavabo', 1, 'forfait', 220, 10, 'SERV-012'),
    section('Raccordements'),
    item('Heure de plomberie', 4, 'heure', 65, 10, 'MO-001'),
    item('Forfait déplacement', 1, 'forfait', 35, 20, 'DEP-001'),
    item('Fournitures de raccordement', 1, 'lot', 48, 20, 'PR-108'),
  ],
  depositPct: 30,
  paymentTerms: PAYMENT_TERMS[0],
  paymentMethods: ['Virement bancaire', 'Chèque', 'Espèces'],
  notes: '',
})

/* ───── Calculs ───── */

export const lineTotal = (l: QuoteLine) => (l.kind === 'item' ? Math.round(l.qty * l.price * (1 - l.discount / 100) * 100) / 100 : 0)

export interface Totals { ht: number; vat: { rate: number; base: number; amount: number }[]; vatTotal: number; ttc: number; deposit: number }

export function computeTotals(lines: QuoteLine[], depositPct: number): Totals {
  const byRate = new Map<number, number>()
  let ht = 0
  for (const l of lines) {
    if (l.kind !== 'item') continue
    const t = lineTotal(l)
    ht += t
    byRate.set(l.vat, (byRate.get(l.vat) ?? 0) + t)
  }
  const vat = [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, base]) => ({ rate, base, amount: Math.round(base * rate) / 100 }))
  const vatTotal = vat.reduce((s, v) => s + v.amount, 0)
  const ttc = Math.round((ht + vatTotal) * 100) / 100
  return { ht, vat, vatTotal, ttc, deposit: Math.round(ttc * depositPct) / 100 }
}

/** Sous-total HT de la section qui commence à l'index donné. */
export function sectionTotal(lines: QuoteLine[], index: number) {
  let s = 0
  for (let i = index + 1; i < lines.length && lines[i].kind !== 'section'; i++) s += lineTotal(lines[i])
  return s
}

export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d
}
export const formatDate = (d: Date | string) =>
  (typeof d === 'string' ? new Date(`${d}T12:00:00`) : d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
