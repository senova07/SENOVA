import { useLayoutEffect, useRef, useState } from 'react'

/* ───── Zoom de l'aperçu (fonctions pures) ───── */

/** `'ajuster'` : la page occupe la largeur de la zone ; sinon une échelle fixe (1 = 100 %). */
export type ModeZoom = 'ajuster' | number

export const ECHELLES_ZOOM = [0.5, 0.65, 0.8, 1, 1.25] as const
/** Largeur d'une page A4 à 96 dpi. */
export const LARGEUR_PAGE_A4 = 794
const MARGE_ZONE = 48
const ECHELLE_MIN_AJUSTEE = 0.3
const ECHELLE_MAX_AJUSTEE = 1.1
const EPSILON = 0.01

/** Échelle « Ajuster à la largeur » : largeur de la zone moins ses marges, bornée à 30 %–110 %. */
export function echelleAjustee(largeurZone: number, largeurPage: number = LARGEUR_PAGE_A4): number {
  return Math.max(ECHELLE_MIN_AJUSTEE, Math.min(ECHELLE_MAX_AJUSTEE, (largeurZone - MARGE_ZONE) / largeurPage))
}

/** Palier de zoom juste en dessous de l'échelle courante (reste au plus petit palier). */
export function zoomMoins(echelle: number): number {
  return [...ECHELLES_ZOOM].filter((e) => e < echelle - EPSILON).pop() ?? ECHELLES_ZOOM[0]
}

/** Palier de zoom juste au-dessus de l'échelle courante (reste au plus grand palier). */
export function zoomPlus(echelle: number): number {
  return ECHELLES_ZOOM.find((e) => e > echelle + EPSILON) ?? ECHELLES_ZOOM[ECHELLES_ZOOM.length - 1]!
}

/**
 * Mesure la zone d'aperçu et donne l'échelle à appliquer à la page.
 * Poser `zoneRef` sur `ZoneApercu` (prop `ref`).
 */
export function useEchelleApercu(zoom: ModeZoom, largeurPage: number = LARGEUR_PAGE_A4) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [largeur, setLargeur] = useState(700)
  useLayoutEffect(() => {
    const el = zoneRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver(([entree]) => entree && setLargeur(entree.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { zoneRef, echelle: zoom === 'ajuster' ? echelleAjustee(largeur, largeurPage) : zoom }
}

/**
 * Ouvre la section `id` si elle est repliée, y fait défiler la colonne et met le focus sur son premier champ.
 * Sous 1200 px, passer d'abord `volet="modification"` à `Atelier` (le défilement attend le rendu suivant).
 */
export function allerASection(id: string): void {
  const section = document.getElementById(id)
  if (!section) return
  const tete = section.querySelector<HTMLButtonElement>('.section-atelier__tete')
  if (tete?.getAttribute('aria-expanded') === 'false') tete.click()
  requestAnimationFrame(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    section.querySelector<HTMLElement>('.section-atelier__corps :is(input, select, textarea, button)')?.focus({ preventScroll: true })
  })
}

