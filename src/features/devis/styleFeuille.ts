import type { PoliceModele } from './donnees'

/** 210 mm en px CSS. */
export const LARGEUR_A4 = 794

export const POLICES: Record<PoliceModele, string> = {
  moderne: "'Instrument Sans', system-ui, sans-serif",
  classique: "Georgia, 'Times New Roman', serif",
  technique: "'Space Grotesk', 'Instrument Sans', system-ui, sans-serif",
}

/** Texte blanc ou navy posé sur l'accent, selon le meilleur contraste (WCAG) ; hex invalide = blanc. */
export function couleurSurAccent(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '#ffffff'
  const n = parseInt(m[1]!, 16)
  const lin = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const lum = 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
  // Contraste avec le blanc (1.05 / (lum + 0.05)) contre celui du navy #031f3f (luminance ≈ 0.014).
  return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.064 ? '#ffffff' : '#031f3f'
}
