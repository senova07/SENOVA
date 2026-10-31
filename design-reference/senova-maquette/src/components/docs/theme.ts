/**
 * Charte graphique des documents (devis, factures, avoirs, bons d'intervention).
 * Le modèle de page, le style de tableau et les couleurs se choisissent indépendamment.
 */

export type TemplateId =
  | 'classique-pro' | 'colonne' | 'hero' | 'plan' | 'epure' | 'bandeau' | 'bloc-client' | 'artisan'
export type TableStyleId =
  | 'standard' | 'entete' | 'alterne' | 'numeros' | 'cartes' | 'minimal' | 'montant' | 'sans-tva' | 'groupes' | 'bordures'
export type FontId = 'geist' | 'serif' | 'lisible' | 'arrondie'
export type DocKind = 'devis' | 'facture' | 'avoir'

export interface Legal {
  siret: string
  vatNumber: string
  legalForm: string
  capital: string
  registry: string
  insurer: string
  insuranceContract: string
  insuranceZone: string
  iban: string
  bic: string
}

export interface DocTexts {
  conditions: string
  thanks: string
  validity: string
  penalties: string
  indemnity: string
}

export interface DocOptions {
  showRefs: boolean
  showUnits: boolean
  groupSections: boolean
  showSignature: boolean
  showQr: boolean
}

export interface DocTheme {
  template: TemplateId
  table: TableStyleId
  primary: string
  accent: string
  font: FontId
  logo: string | null // null = logo par défaut de l'entreprise ; sinon image importée (data URL)
  /** Photo de réalisation (modèles « Hero image » et « Artisan ») ; sans photo, un motif graphique la remplace */
  photo: string | null
  logoSize: 'S' | 'M' | 'L'
  logoAlign: 'left' | 'center'
  showContact: boolean
  footer: string
  footerLegal: boolean
  legal: Legal
  texts: DocTexts
  options: DocOptions
}

export const DEFAULT_THEME: DocTheme = {
  template: 'classique-pro',
  table: 'standard',
  primary: '#0B2A50',
  accent: '#16B8B0',
  font: 'geist',
  logo: null,
  photo: null,
  logoSize: 'M',
  logoAlign: 'left',
  showContact: true,
  footer: 'Atelier Martin, votre artisan plombier-chauffagiste à Lyon depuis 2009.',
  footerLegal: true,
  legal: {
    siret: '812 345 678 00021',
    vatNumber: 'FR 32 812345678',
    legalForm: 'SARL',
    capital: '5 000 €',
    registry: 'RM Lyon 812 345 678',
    insurer: 'MAAF Pro',
    insuranceContract: '',
    insuranceZone: 'France métropolitaine',
    iban: '',
    bic: '',
  },
  texts: {
    conditions: 'Devis gratuit. Les travaux débuteront après réception du devis signé et de l’acompte. Toute prestation supplémentaire fera l’objet d’un avenant.',
    thanks: 'Merci pour votre confiance',
    validity: 'Ce devis est valable 30 jours à compter de sa date d’émission.',
    penalties: 'En cas de retard de paiement, des pénalités au taux de 3 fois le taux d’intérêt légal seront appliquées.',
    indemnity: 'Pour les clients professionnels : indemnité forfaitaire de 40 € pour frais de recouvrement.',
  },
  options: { showRefs: false, showUnits: true, groupSections: true, showSignature: true, showQr: false },
}

/** Modèles de mise en page : où se trouvent logo, client, titre, prestations et totaux. */
export const TEMPLATES: { id: TemplateId; label: string; hint: string; recommended?: boolean; photo?: boolean }[] = [
  { id: 'classique-pro', label: 'Classique pro', hint: 'Sobre et rassurant, idéal pour tous les artisans.', recommended: true },
  { id: 'colonne', label: 'Colonne latérale', hint: 'Coordonnées et informations clés dans une colonne.' },
  { id: 'hero', label: 'Hero image', hint: 'Une photo de réalisation pour valoriser votre savoir-faire.', photo: true },
  { id: 'plan', label: 'Plan chantier', hint: 'Style technique, pour la rénovation et la construction.', recommended: true },
  { id: 'epure', label: 'Épuré premium', hint: 'Minimaliste et élégant, image haut de gamme.' },
  { id: 'bandeau', label: 'Bandeau moderne', hint: 'Plus visuel tout en restant professionnel.', recommended: true },
  { id: 'bloc-client', label: 'Bloc client', hint: 'Client et chantier mis en avant, très clair.', recommended: true },
  { id: 'artisan', label: 'Artisan', hint: 'Visuel, avec une zone de réassurance.', photo: true },
]

/** Styles de tableau : comment les prestations, sections, quantités et prix sont présentés. */
export const TABLE_STYLES: { id: TableStyleId; label: string; hint: string; recommended?: boolean }[] = [
  { id: 'standard', label: 'Standard', hint: 'Classique et lisible' },
  { id: 'entete', label: 'En-tête coloré', hint: 'Met en valeur vos couleurs', recommended: true },
  { id: 'alterne', label: 'Lignes alternées', hint: 'Confortable pour les longs devis', recommended: true },
  { id: 'numeros', label: 'Avec numéros', hint: 'Pour se référer facilement aux lignes', recommended: true },
  { id: 'cartes', label: 'Sections en cartes', hint: 'Chaque section ressort visuellement', recommended: true },
  { id: 'minimal', label: 'Minimaliste', hint: 'Design épuré, haut de gamme' },
  { id: 'montant', label: 'Montant mis en avant', hint: 'Les totaux de ligne plus visibles' },
  { id: 'sans-tva', label: 'Sans colonne TVA', hint: 'Plus simple si un seul taux' },
  { id: 'groupes', label: 'Groupes visuels', hint: 'Sections en bandeaux de couleur' },
  { id: 'bordures', label: 'Bordures modernes', hint: 'Structuré, quadrillage fin' },
]

export const FONTS: { id: FontId; label: string; family: string }[] = [
  { id: 'geist', label: 'Moderne', family: '"Geist", system-ui, sans-serif' },
  { id: 'serif', label: 'Classique', family: '"Source Serif 4", Georgia, serif' },
  { id: 'lisible', label: 'Très lisible', family: '"Atkinson Hyperlegible", Verdana, sans-serif' },
  { id: 'arrondie', label: 'Douce', family: '"Manrope", system-ui, sans-serif' },
]

export const PRESET_PALETTES: { id: string; label: string; primary: string; accent: string }[] = [
  { id: 'marine', label: 'Bleu marine', primary: '#0B2A50', accent: '#16B8B0' },
  { id: 'turquoise', label: 'Turquoise', primary: '#0E6E6A', accent: '#16B8B0' },
  { id: 'vert', label: 'Vert', primary: '#1E5E3B', accent: '#4DAF68' },
  { id: 'orange', label: 'Orange', primary: '#8A3F12', accent: '#E8892E' },
  { id: 'rouge', label: 'Rouge', primary: '#8E1B2B', accent: '#E05A5A' },
  { id: 'violet', label: 'Violet', primary: '#3F2475', accent: '#8B64D8' },
  { id: 'anthracite', label: 'Anthracite', primary: '#2B2F36', accent: '#8A94A3' },
]

export const LOGO_HEIGHT = { S: 34, M: 46, L: 60 } as const

/* ───── Couleurs ───── */

export const normalizeHex = (raw: string): string | null => {
  let s = raw.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toUpperCase()}` : null
}

export const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
export const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase()

/** Mélange une couleur avec le blanc (t = part de la couleur). */
export const tint = (hex: string, t: number) => {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(255 - (255 - r) * t, 255 - (255 - g) * t, 255 - (255 - b) * t)
}

const lum = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Couleur de texte lisible posée sur un fond donné. */
export const onColor = (bg: string) => (contrast(bg, '#FFFFFF') >= 3.2 ? '#FFFFFF' : '#18253A')

/* HSV ⇄ hex pour la roue chromatique */
export function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255)
}
export function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min
  let h = 0
  if (d) {
    if (max === R) h = 60 * (((G - B) / d) % 6)
    else if (max === G) h = 60 * ((B - R) / d + 2)
    else h = 60 * ((R - G) / d + 4)
  }
  return { h: (h + 360) % 360, s: max ? d / max : 0, v: max }
}

/** Palettes proposées à partir des couleurs dominantes d'un logo. */
export async function palettesFromImage(src: string): Promise<string[][]> {
  const img = new Image()
  img.src = src
  await img.decode()
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data
  const counts = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
    if (a < 200) continue
    if (r > 235 && g > 235 && b > 235) continue
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`
    const e = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    e.n++; e.r += r; e.g += g; e.b += b
    counts.set(key, e)
  }
  const colors = [...counts.values()].sort((a, b) => b.n - a.n).map((e) => rgbToHex(e.r / e.n, e.g / e.n, e.b / e.n))
  const distinct: string[] = []
  for (const c of colors) if (distinct.every((d) => contrast(c, d) > 1.4)) distinct.push(c)
  if (!distinct.length) return DEFAULT_LOGO_PALETTES
  const darkest = [...distinct].sort((a, b) => lum(a) - lum(b))
  const main = darkest[0]
  const lively = distinct.find((c) => c !== main && hexToHsv(c).s > 0.35) ?? darkest[1] ?? '#16B8B0'
  const third = distinct.find((c) => c !== main && c !== lively) ?? tint(main, 0.55)
  return [
    [main, lively, tint(lively, 0.15)],
    [main, third, tint(main, 0.1)],
    [lively, main, tint(lively, 0.12)].map((c, i) => (i === 0 && contrast(c, '#FFFFFF') < 3 ? main : c)),
  ]
}

export const DEFAULT_LOGO_PALETTES: string[][] = [
  ['#0B2A50', '#16B8B0', '#E6F7F6'],
  ['#0B2A50', '#3B78B5', '#E9EEF5'],
  ['#14324F', '#7FC4DE', '#EEF3F7'],
]
