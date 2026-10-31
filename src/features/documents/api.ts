import { useSyncExternalStore } from 'react'
import { CHARTE_PAR_DEFAUT, type ChartePage } from './rendu'

/*
 * Charte des documents appliquée à l'organisation.
 * shortcut: démo en mémoire (perdue au rechargement), pas d'API encore ;
 * à brancher sur GET / PUT /api/organisation/charte en gardant ces signatures.
 */

let charte: ChartePage = CHARTE_PAR_DEFAUT
const abonnes = new Set<() => void>()

function abonner(rappel: () => void) {
  abonnes.add(rappel)
  return () => {
    abonnes.delete(rappel)
  }
}

export const apiCharte = {
  /** Vrai tant que l'enregistrement n'est pas branché sur l'API : l'interface doit le dire. */
  demo: true,
  lire: async (): Promise<ChartePage> => charte,
  appliquer: async (nouvelle: ChartePage): Promise<ChartePage> => {
    charte = nouvelle
    abonnes.forEach((rappel) => rappel())
    return charte
  },
}

/** Charte appliquée, mise à jour dès qu'elle change (aperçus des devis, factures, avoirs). */
export function useCharteAppliquee(): ChartePage {
  return useSyncExternalStore(abonner, () => charte)
}
