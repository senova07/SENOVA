import { useSyncExternalStore } from 'react'
import { CHARTE_PAR_DEFAUT, DOCUMENT_EXEMPLE, type ChartePage, type MentionsLegales, type TextesDocument } from './rendu'

/*
 * Réglages des documents de l'organisation.
 * shortcut: démo en mémoire (perdue au rechargement), pas d'API encore ; chaque magasin garde la forme
 * lire / appliquer de l'API future, pour la brancher sans toucher aux composants.
 */

function creerMagasin<T>(initial: T) {
  let valeur = initial
  const abonnes = new Set<() => void>()
  return {
    lire: () => valeur,
    ecrire(nouvelle: T) {
      valeur = nouvelle
      abonnes.forEach((rappel) => rappel())
    },
    abonner(rappel: () => void) {
      abonnes.add(rappel)
      return () => {
        abonnes.delete(rappel)
      }
    },
  }
}

const magasinCharte = creerMagasin<ChartePage>(CHARTE_PAR_DEFAUT)

export const apiCharte = {
  /** Vrai tant que l'enregistrement n'est pas branché sur l'API : l'interface doit le dire. */
  demo: true,
  // À brancher : GET /api/organisation/charte
  lire: async (): Promise<ChartePage> => magasinCharte.lire(),
  // À brancher : PUT /api/organisation/charte
  appliquer: async (nouvelle: ChartePage): Promise<ChartePage> => {
    magasinCharte.ecrire(nouvelle)
    return magasinCharte.lire()
  },
}

/** Charte appliquée, mise à jour dès qu'elle change (aperçus des devis, factures, avoirs). */
export function useCharteAppliquee(): ChartePage {
  return useSyncExternalStore(magasinCharte.abonner, magasinCharte.lire)
}

/** Mentions légales et textes par défaut : des réglages de l'organisation, pas de la charte graphique. */
export interface ReglagesDocuments {
  mentions: MentionsLegales
  textes: TextesDocument
  conditionsPaiement: string
}

/** Mentions vides : elles se préremplissent depuis l'organisation de la session (voir apparence/reglages). */
export const REGLAGES_PAR_DEFAUT: ReglagesDocuments = {
  mentions: {
    siret: '', numeroTva: '', formeJuridique: '', capital: '', registre: '',
    assureur: '', contratAssurance: '', zoneAssurance: '', iban: '', bic: '',
  },
  textes: DOCUMENT_EXEMPLE.textes,
  conditionsPaiement: DOCUMENT_EXEMPLE.conditionsPaiement,
}

const magasinReglages = creerMagasin<ReglagesDocuments>(REGLAGES_PAR_DEFAUT)

export const apiReglagesDocuments = {
  demo: true,
  // À brancher : GET /api/organisation/documents
  lire: async (): Promise<ReglagesDocuments> => magasinReglages.lire(),
  // À brancher : PUT /api/organisation/documents
  appliquer: async (nouveaux: ReglagesDocuments): Promise<ReglagesDocuments> => {
    magasinReglages.ecrire(nouveaux)
    return magasinReglages.lire()
  },
}

export function useReglagesDocuments(): ReglagesDocuments {
  return useSyncExternalStore(magasinReglages.abonner, magasinReglages.lire)
}

/** Démo seulement : efface charte et réglages (IBAN, SIRET, logo…) pour ne pas les laisser fuir d'une organisation à l'autre. */
export function reinitialiserDemoDocuments(): void {
  magasinCharte.ecrire(CHARTE_PAR_DEFAUT)
  magasinReglages.ecrire(REGLAGES_PAR_DEFAUT)
}
