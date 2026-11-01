import { useContext, type KeyboardEvent, type ReactNode } from 'react'
import { ContexteCible } from './contexteCible'
import type { ZoneDocument } from './types'

const LIBELLES: Record<ZoneDocument, string> = {
  entete: 'Modifier l’en-tête',
  client: 'Modifier le client',
  informations: 'Modifier les informations',
  lignes: 'Modifier les lignes',
  totaux: 'Modifier le récapitulatif',
  conditions: 'Modifier les conditions',
  pied: 'Modifier le pied de page',
}

interface Props {
  zone: ZoneDocument
  children: ReactNode
  /** Classe utilitaire : « doc-zone--pied » (poussée en bas de page), « doc-zone--pleine » (déborde des marges). */
  variante?: 'pied' | 'pleine'
}

/**
 * Zone du document. Statique sans rappel `onCibler` ; sinon un bouton accessible
 * (le contenu est un bloc, donc `role="button"` plutôt qu'un `<button>`).
 */
export function Zone({ zone, children, variante }: Props) {
  const cibler = useContext(ContexteCible)
  const classe = variante ? `doc-zone doc-zone--${variante}` : 'doc-zone'
  if (!cibler) return <div className={classe}>{children}</div>

  const auClavier = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      cibler(zone)
    }
  }
  return (
    <div className={classe} role="button" tabIndex={0} aria-label={LIBELLES[zone]} data-cliquable onClick={() => cibler(zone)} onKeyDown={auClavier}>
      {children}
    </div>
  )
}
