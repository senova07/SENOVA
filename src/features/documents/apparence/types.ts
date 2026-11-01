import type { ReglagesDocuments } from '../api'
import type { ChartePage } from '../rendu'

/** Ce qu'on modifie à l'écran, et qu'on annule d'un bloc : la charte graphique et les réglages de l'organisation. */
export interface Brouillon {
  charte: ChartePage
  reglages: ReglagesDocuments
}

/** `cle` regroupe un geste continu (roue, saisie) en une seule étape d'annulation. */
export type ModifierCharte = (patch: Partial<ChartePage>, cle?: string) => void
export type ModifierReglages = (patch: Partial<ReglagesDocuments>, cle?: string) => void
