import { ErreurApi } from '@/services/http'
import { apiArticles } from '@/services/articlesApi'
import type { CategorieArticle } from '@shared/articles'
import { versSaisie, type LigneImport } from './modele'

/** Plafond par envoi : au-delà, les lignes restent dans le tableau pour un second envoi. */
export const MAX_ENVOI = 1000

/** Pourquoi la boucle s'est arrêtée avant la fin. */
export type Arret = 'session' | 'limite' | 'interrompu'

export interface BilanEnvoi {
  /** Identifiants des lignes créées. */
  crees: string[]
  echecs: { id: string; message: string }[]
  /** Lignes non envoyées parce que la boucle s'est arrêtée. */
  nonEnvoyees: number
  arret?: Arret
}

/**
 * L'API n'a pas d'import en lot : une requête par ligne, en séquence, pour un bilan honnête ligne par ligne.
 * Session expirée (401), trop de requêtes (429) ou `continuer()` faux : on s'arrête, le reste est compté « non envoyé ».
 */
export async function envoyerLignes(
  lignes: readonly LigneImport[],
  categories: readonly CategorieArticle[],
  surProgression: (faits: number) => void,
  continuer: () => boolean = () => true,
): Promise<BilanEnvoi> {
  const bilan: BilanEnvoi = { crees: [], echecs: [], nonEnvoyees: 0 }
  for (const [i, ligne] of lignes.entries()) {
    if (!continuer()) {
      bilan.arret = 'interrompu'
      bilan.nonEnvoyees = lignes.length - i
      break
    }
    try {
      await apiArticles.creer(versSaisie(ligne, categories))
      bilan.crees.push(ligne.id)
    } catch (e) {
      const arret: Arret | undefined = e instanceof ErreurApi ? (e.sessionPerdue ? 'session' : e.statut === 429 ? 'limite' : undefined) : undefined
      if (arret) {
        bilan.arret = arret
        bilan.nonEnvoyees = lignes.length - i
        break
      }
      bilan.echecs.push({ id: ligne.id, message: e instanceof Error ? e.message : 'Erreur inconnue' })
    }
    surProgression(i + 1)
  }
  return bilan
}
