import { useState, type DragEvent } from 'react'
import { decalerLigne, deplacerLigne } from './calculs'
import type { LigneDevis } from './types'

/** Type propre : un dépôt ne doit jamais insérer l'id dans un champ texte. */
const TYPE_LIGNE = 'application/x-senova-ligne'

/** Glisser-déposer des lignes (souris) et Alt + flèches (clavier). `onChange` reçoit la liste réordonnée. */
export function useGlisserLignes(lignes: readonly LigneDevis[], onChange: (suite: LigneDevis[]) => void) {
  const [glisse, setGlisse] = useState<string | null>(null)
  const [cible, setCible] = useState<{ id: string; apres: boolean } | null>(null)

  const fin = () => {
    setGlisse(null)
    setCible(null)
  }

  return {
    glisse,
    cible,
    fin,
    debut(ev: DragEvent<HTMLElement>, id: string) {
      setGlisse(id)
      ev.dataTransfer.effectAllowed = 'move'
      ev.dataTransfer.setData(TYPE_LIGNE, id)
    },
    survol(ev: DragEvent<HTMLElement>, id: string) {
      if (!glisse) return
      ev.preventDefault()
      const r = ev.currentTarget.getBoundingClientRect()
      setCible({ id, apres: ev.clientY > r.top + r.height / 2 })
    },
    depot(ev: DragEvent<HTMLElement>) {
      ev.preventDefault()
      if (glisse && cible && glisse !== cible.id) {
        onChange(deplacerLigne(lignes, glisse, cible.id, cible.apres))
      }
      fin()
    },
    decaler(id: string, delta: -1 | 1) {
      onChange(decalerLigne(lignes, id, delta))
      // La poignée garde le focus après le déplacement, pour enchaîner les touches.
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-ligne="${id}"] .devis-poignee`)?.focus(),
      )
    },
  }
}
