import type { ReactNode } from 'react'

/** Corps d'une section du formulaire : désactive tous les champs d'un coup quand le devis est figé. */
export function Champs({ desactive, children }: { desactive: boolean; children: ReactNode }) {
  return (
    <fieldset className="devis-champs" disabled={desactive}>
      {children}
    </fieldset>
  )
}
