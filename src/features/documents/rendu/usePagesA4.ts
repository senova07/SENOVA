import { useEffect, useRef, useState } from 'react'

export const A4_LARGEUR = 794
export const A4_HAUTEUR = 1123

/**
 * Mesure la page et renvoie sa hauteur arrondie au multiple de A4 supérieur (1 page minimum).
 * C'est un repère visuel pour l'aperçu, pas une vraie pagination.
 */
export function usePagesA4(actif: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!actif || !el || typeof ResizeObserver === 'undefined') return
    const observateur = new ResizeObserver(() => setPages(Math.max(1, Math.ceil(el.scrollHeight / A4_HAUTEUR))))
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [actif])

  return { ref, pages }
}
