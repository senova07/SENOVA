import type { ReactNode } from 'react'
import { useMenu } from '@/hooks/useMenu'

interface MenuDeroulantProps {
  /** Le bouton d'ouverture : il pose lui-même aria-expanded et l'appel à `basculer`. */
  declencheur(etat: { ouvert: boolean; basculer(): void }): ReactNode
  /** Contenu du menu ouvert ; `fermer` à appeler après une action. */
  children(fermer: () => void): ReactNode
}

export function MenuDeroulant({ declencheur, children }: MenuDeroulantProps) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  return (
    <div className="menu" ref={ancre}>
      {declencheur({ ouvert, basculer })}
      {ouvert ? children(fermer) : null}
    </div>
  )
}
