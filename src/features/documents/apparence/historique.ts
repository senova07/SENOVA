/** Historique d'annulation : réducteur pur, sans horloge. */

export interface Historique<T> {
  present: T
  passe: T[]
  /** Clé du geste continu en cours (roue, saisie) : les modifications de même clé forment une seule étape. */
  cle: string | null
}

export type ActionHistorique<T> =
  | { type: 'modifier'; maj(valeur: T): T; cle?: string }
  | { type: 'remplacer'; valeur: T }
  | { type: 'annuler' }
  /** Fin d'un geste continu (pointerup, blur) : la prochaine modification de même clé ouvre une nouvelle étape. */
  | { type: 'clore' }

export const LIMITE_HISTORIQUE = 50

export const historiqueInitial = <T,>(present: T): Historique<T> => ({ present, passe: [], cle: null })

const empiler = <T,>(passe: T[], valeur: T): T[] => [...passe.slice(-(LIMITE_HISTORIQUE - 1)), valeur]

export function reducteurHistorique<T>(etat: Historique<T>, action: ActionHistorique<T>): Historique<T> {
  switch (action.type) {
    case 'modifier': {
      const present = action.maj(etat.present)
      if (present === etat.present) return etat
      const continu = action.cle !== undefined && action.cle === etat.cle
      return { present, passe: continu ? etat.passe : empiler(etat.passe, etat.present), cle: action.cle ?? null }
    }
    case 'remplacer':
      return { present: action.valeur, passe: empiler(etat.passe, etat.present), cle: null }
    case 'clore':
      return etat.cle === null ? etat : { ...etat, cle: null }
    case 'annuler': {
      const precedent = etat.passe[etat.passe.length - 1]
      if (precedent === undefined) return etat
      return { present: precedent, passe: etat.passe.slice(0, -1), cle: null }
    }
  }
}
