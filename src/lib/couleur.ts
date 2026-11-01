/** Utilitaires couleur purs (hex, RVB, TSL, contraste WCAG, palettes depuis un logo). */

export interface Rvb { r: number; g: number; b: number }
/** Teinte 0-360, saturation et luminosité 0-1. */
export interface Tsl { t: number; s: number; l: number }

const NOIR: Rvb = { r: 0, g: 0, b: 0 }
const borner = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/** « #abc », « ABC », « #AABBCC » deviennent « #AABBCC » ; null si invalide. */
export function normaliserHex(brut: string): string | null {
  let s = brut.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toUpperCase()}` : null
}

export const estHexValide = (brut: string): boolean => normaliserHex(brut) !== null

/** Un hex invalide donne null. Les fonctions ci-dessous le traitent comme du noir. */
export function hexVersRvb(hex: string): Rvb | null {
  const h = normaliserHex(hex)
  if (!h) return null
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) }
}

export const rvbVersHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((v) => Math.round(borner(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`.toUpperCase()

export function rvbVersTsl({ r, g, b }: Rvb): Tsl {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  const l = (max + min) / 2
  if (d === 0) return { t: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let t: number
  if (max === R) t = 60 * (((G - B) / d) % 6)
  else if (max === G) t = 60 * ((B - R) / d + 2)
  else t = 60 * ((R - G) / d + 4)
  return { t: (t + 360) % 360, s, l }
}

export function tslVersRvb({ t, s, l }: Tsl): Rvb {
  const teinte = ((t % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((teinte / 60) % 2) - 1))
  const m = l - c / 2
  const sextant = Math.floor(teinte / 60)
  const [r, g, b] = ([[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]] as const)[sextant % 6] ?? [0, 0, 0]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

export const hexVersTsl = (hex: string): Tsl => rvbVersTsl(hexVersRvb(hex) ?? NOIR)
export const tslVersHex = (tsl: Tsl): string => {
  const { r, g, b } = tslVersRvb(tsl)
  return rvbVersHex(r, g, b)
}

/** Mélange avec le blanc ; `part` = part de la couleur d'origine (1 = inchangée, 0 = blanc). */
export function melangerAvecBlanc(hex: string, part: number): string {
  const { r, g, b } = hexVersRvb(hex) ?? NOIR
  const k = borner(part, 0, 1)
  return rvbVersHex(255 - (255 - r) * k, 255 - (255 - g) * k, 255 - (255 - b) * k)
}

/** Luminance relative WCAG, de 0 (noir) à 1 (blanc). */
export function luminance(hex: string): number {
  const { r, g, b } = hexVersRvb(hex) ?? NOIR
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** Rapport de contraste WCAG, de 1 à 21. */
export function rapportContraste(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Blanc ou encre sombre, selon ce qui se lit le mieux sur le fond. */
export const couleurTexteLisible = (fond: string, clair = '#FFFFFF', sombre = '#18253A'): string =>
  rapportContraste(fond, clair) >= 3.2 ? clair : sombre

/* ───── Palettes depuis un logo ───── */

export const PALETTES_LOGO_PAR_DEFAUT: string[][] = [
  ['#0B2A50', '#16B8B0', '#E6F7F6'],
  ['#0B2A50', '#3B78B5', '#E9EEF5'],
  ['#14324F', '#7FC4DE', '#EEF3F7'],
]

/** Pure : `pixels` est un tableau RVBA à plat (comme `ImageData.data`). Renvoie jusqu'à 3 palettes [principale, accent, fond]. */
export function extrairePalettes(pixels: ArrayLike<number>): string[][] {
  const seaux = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0, pixels[i + 3] ?? 0]
    if (a < 200 || (r > 235 && g > 235 && b > 235)) continue
    const cle = `${r >> 5}-${g >> 5}-${b >> 5}`
    const e = seaux.get(cle) ?? { n: 0, r: 0, g: 0, b: 0 }
    e.n++; e.r += r; e.g += g; e.b += b
    seaux.set(cle, e)
  }
  const couleurs = [...seaux.values()].sort((a, b) => b.n - a.n).map((e) => rvbVersHex(e.r / e.n, e.g / e.n, e.b / e.n))
  const distinctes: string[] = []
  for (const c of couleurs) if (distinctes.every((d) => rapportContraste(c, d) > 1.4)) distinctes.push(c)
  if (!distinctes.length) return PALETTES_LOGO_PAR_DEFAUT

  const parSombre = [...distinctes].sort((a, b) => luminance(a) - luminance(b))
  const principale = parSombre[0] ?? PALETTES_LOGO_PAR_DEFAUT[0]?.[0] ?? '#0B2A50'
  const vive = distinctes.find((c) => c !== principale && hexVersTsl(c).s > 0.35) ?? parSombre[1] ?? '#16B8B0'
  const troisieme = distinctes.find((c) => c !== principale && c !== vive) ?? melangerAvecBlanc(principale, 0.55)
  return [
    [principale, vive, melangerAvecBlanc(vive, 0.15)],
    [principale, troisieme, melangerAvecBlanc(principale, 0.1)],
    [rapportContraste(vive, '#FFFFFF') < 3 ? principale : vive, principale, melangerAvecBlanc(vive, 0.12)],
  ]
}

/** Lit les pixels d'une image dans un canvas puis délègue à `extrairePalettes`. Non testée (canvas). */
export async function palettesDepuisImage(src: string): Promise<string[][]> {
  const img = new Image()
  img.src = src
  await img.decode()
  const taille = 64
  const canvas = document.createElement('canvas')
  canvas.width = taille
  canvas.height = taille
  const ctx = canvas.getContext('2d')
  if (!ctx) return PALETTES_LOGO_PAR_DEFAUT
  ctx.drawImage(img, 0, 0, taille, taille)
  return extrairePalettes(ctx.getImageData(0, 0, taille, taille).data)
}
