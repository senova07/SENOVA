import { useSyncExternalStore } from 'react'
import { DEVIS_DEMO } from './demo'
import type { Devis } from './types'

/**
 * Magasin des devis en mémoire, lu en direct par la liste, Aujourd'hui, la fiche client et les compteurs.
 * shortcut: rien n'est persisté, tout repart des données de démo au rechargement ;
 * à remplacer par un cache de requêtes quand l'API devis existera. Les écrans d'édition passent par `apiDevis`.
 */
let etat: Devis[] = DEVIS_DEMO
const abonnes = new Set<() => void>()

const abonner = (rappel: () => void) => {
  abonnes.add(rappel)
  return () => {
    abonnes.delete(rappel)
  }
}
const lire = () => etat

export const magasinDevis = {
  useListe: () => useSyncExternalStore(abonner, lire),
  lire,
  /** Ajoute ou remplace le devis de même id. */
  enregistrer(devis: Devis) {
    etat = etat.some((d) => d.id === devis.id)
      ? etat.map((d) => (d.id === devis.id ? devis : d))
      : [devis, ...etat]
    abonnes.forEach((rappel) => rappel())
  },
  /** Remet les données de démo initiales (changement d'organisation : rien ne doit fuiter). */
  reinitialiser() {
    etat = DEVIS_DEMO
    abonnes.forEach((rappel) => rappel())
  },
  supprimer(id: string) {
    etat = etat.filter((d) => d.id !== id)
    abonnes.forEach((rappel) => rappel())
  },
}
