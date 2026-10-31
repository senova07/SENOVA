import { useCallback, useEffect, useRef, useState } from 'react'
import { apiDevis } from './api'
import type { Devis } from './types'

export type EtatBrouillon = 'intact' | 'modifie' | 'enregistre' | 'erreur'

/**
 * Devis en cours d'édition. Rien n'est écrit tant qu'on n'enregistre pas ; quitter l'écran avec des
 * modifications les enregistre (dans le magasin de démo) pour ne pas les perdre.
 */
export function useBrouillonDevis(initial: Devis) {
  const [devis, setDevis] = useState(initial)
  const [etat, setEtat] = useState<EtatBrouillon>('intact')
  const dernier = useRef({ devis, sale: false })

  useEffect(() => {
    dernier.current.devis = devis
  }, [devis])
  useEffect(
    () => () => {
      if (dernier.current.sale) void apiDevis.enregistrerBrouillon(dernier.current.devis)
    },
    [],
  )

  const modifier = useCallback((patch: Partial<Devis> | ((d: Devis) => Partial<Devis>)) => {
    dernier.current.sale = true
    setEtat('modifie')
    setDevis((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }))
  }, [])

  const enregistrer = useCallback(async () => {
    try {
      const envoye = dernier.current.devis
      const enregistre = await apiDevis.enregistrerBrouillon(envoye)
      // Modifié pendant l'appel : le devis reste « à enregistrer ».
      if (dernier.current.devis !== envoye) return
      dernier.current.sale = false
      setDevis((d) => ({ ...d, majLe: enregistre.majLe }))
      setEtat('enregistre')
    } catch {
      setEtat('erreur')
    }
  }, [])

  return { devis, modifier, enregistrer, etat }
}
