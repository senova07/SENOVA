import { useCallback, useReducer } from 'react'
import { historiqueInitial, reducteurHistorique, type ActionHistorique, type Historique } from './historique'

/** Valeur éditable avec annulation. `cle` regroupe les gestes continus en une seule étape. */
export function useHistorique<T>(initial: T) {
  const [etat, envoyer] = useReducer(
    (e: Historique<T>, a: ActionHistorique<T>) => reducteurHistorique(e, a),
    initial,
    historiqueInitial,
  )
  const modifier = useCallback((maj: (valeur: T) => T, cle?: string) => envoyer({ type: 'modifier', maj, cle }), [])
  const remplacer = useCallback((valeur: T) => envoyer({ type: 'remplacer', valeur }), [])
  const annuler = useCallback(() => envoyer({ type: 'annuler' }), [])
  const clore = useCallback(() => envoyer({ type: 'clore' }), [])
  return { clore, valeur: etat.present, peutAnnuler: etat.passe.length > 0, modifier, remplacer, annuler }
}
