const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
const pct = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })
const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatPrice = (n: number) => eur.format(n)
export const formatVat = (n: number) => `${pct.format(n)} %`

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** « Aujourd’hui », « Hier », sinon « 12 oct. » */
export function formatLastUsed(iso: string | null): string {
  if (!iso) return 'Jamais utilisé'
  const d = new Date(iso)
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000)
  if (diff === 0) return 'Aujourd’hui'
  if (diff === 1) return 'Hier'
  return shortDate.format(d)
}

export const formatLongDate = (iso: string) => longDate.format(new Date(iso))

/** Parse une saisie de prix française (« 1 234,50 ») */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/\s| |€/g, '').replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
