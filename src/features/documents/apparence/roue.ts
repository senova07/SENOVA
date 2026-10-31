import type { Tsl } from '../../../lib/couleur'

/** Géométrie de la roue chromatique : la teinte tourne autour du cercle (0° à gauche, sens horaire), la saturation va du centre au bord. */

const borner = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
export const modulo360 = (t: number): number => ((t % 360) + 360) % 360

/** Teinte (0-360) du point situé à (dx, dy) du centre, axe y vers le bas. */
export const teinteDepuisPosition = (dx: number, dy: number): number => modulo360((Math.atan2(dy, dx) * 180) / Math.PI + 180)

/** Saturation (0-1) selon la distance au centre. */
export const saturationDepuisDistance = (distance: number, rayon: number): number => borner(distance / rayon, 0, 1)

/** Position du repère par rapport au centre ; réciproque de `teinteDepuisPosition`. */
export function positionDepuisTeinte(t: number, s: number, rayon: number): { x: number; y: number } {
  const angle = ((t - 180) * Math.PI) / 180
  return { x: Math.cos(angle) * s * rayon, y: Math.sin(angle) * s * rayon }
}

/** Couleur choisie au clic en (dx, dy) : garde la luminosité courante. */
export function tslDepuisClic(dx: number, dy: number, rayon: number, l: number): Tsl {
  return { t: teinteDepuisPosition(dx, dy), s: saturationDepuisDistance(Math.hypot(dx, dy), rayon), l }
}

/** Touches fléchées de la roue : gauche/droite tournent la teinte, haut/bas règlent la saturation. */
export function deplacerSurRoue(tsl: Tsl, touche: string, grand: boolean): Tsl | null {
  const pas = grand ? 15 : 4
  switch (touche) {
    case 'ArrowLeft': return { ...tsl, t: modulo360(tsl.t - pas) }
    case 'ArrowRight': return { ...tsl, t: modulo360(tsl.t + pas) }
    case 'ArrowUp': return { ...tsl, s: borner(tsl.s + 0.05, 0, 1) }
    case 'ArrowDown': return { ...tsl, s: borner(tsl.s - 0.05, 0, 1) }
    default: return null
  }
}

/** Touches du curseur de luminosité : haut éclaircit, bas assombrit. */
export function deplacerLuminosite(l: number, touche: string, grand: boolean): number | null {
  const pas = grand ? 0.1 : 0.04
  if (touche === 'ArrowUp' || touche === 'ArrowRight') return borner(l + pas, 0, 1)
  if (touche === 'ArrowDown' || touche === 'ArrowLeft') return borner(l - pas, 0, 1)
  return null
}
