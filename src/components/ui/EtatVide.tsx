import type { ReactNode } from 'react'
import { Icone, type NomIcone } from '@/components/ui/Icone'

interface EtatVideProps {
  icone?: NomIcone
  titre: string
  texte?: string
  action?: ReactNode
}

export function EtatVide({ icone = 'vide', titre, texte, action }: EtatVideProps) {
  return (
    <div className="etat-vide">
      <Icone nom={icone} taille={40} className="etat-vide__icone" />
      <p className="etat-vide__titre">{titre}</p>
      {texte ? <p>{texte}</p> : null}
      {action}
    </div>
  )
}
