import { useEffect, useState } from 'react'

const ITEMS = '[role^="menuitem"]:not(:disabled)'

/**
 * Menu déroulant : se ferme au clic en dehors et sur Échap (le focus revient au déclencheur),
 * focus sur le premier élément à l'ouverture, flèches haut/bas entre les éléments.
 * `ancre` se pose en ref sur le conteneur.
 */
export function useMenu() {
  const [ouvert, setOuvert] = useState(false)
  const [conteneur, ancre] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ouvert || !conteneur) return
    const items = () => [...conteneur.querySelectorAll<HTMLElement>(ITEMS)]
    items()[0]?.focus()

    const clic = (e: MouseEvent) => {
      if (!conteneur.contains(e.target as Node)) setOuvert(false)
    }
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Capture + arrêt : un calque (Dialogue, PanneauLateral) contenant le menu ne doit pas se fermer aussi.
        e.stopPropagation()
        setOuvert(false)
        conteneur.querySelector<HTMLElement>('[aria-expanded]')?.focus()
        return
      }
      const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
      const liste = items()
      if (!delta || !liste.length || !conteneur.contains(document.activeElement)) return
      e.preventDefault()
      const rang = liste.indexOf(document.activeElement as HTMLElement)
      liste[(rang + delta + liste.length) % liste.length]?.focus()
    }
    document.addEventListener('mousedown', clic)
    document.addEventListener('keydown', touche, true)
    return () => {
      document.removeEventListener('mousedown', clic)
      document.removeEventListener('keydown', touche, true)
    }
  }, [ouvert, conteneur])

  return { ouvert, ancre, basculer: () => setOuvert((o) => !o), fermer: () => setOuvert(false) }
}
