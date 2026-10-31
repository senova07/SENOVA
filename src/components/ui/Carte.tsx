import type { ReactNode } from 'react'
import { Icone, type NomIcone } from '@/components/ui/Icone'

interface CarteProps {
  /** Petit triangle turquoise en haut à droite (signature FACET). */
  coin?: boolean
  className?: string
  children: ReactNode
}

export function Carte({ coin = false, className, children }: CarteProps) {
  return (
    <div className={['carte', coin ? 'carte--coin' : '', className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

interface CarteKpiProps {
  libelle: string
  valeur: string
  sousTexte?: string
  /** Dessin gris en fond, rappelant ce que mesure la carte (décoratif). */
  illustration?: NomIcone
}

/** Carte d'indicateur : chiffre en grand, libellé, sous-texte. */
export function CarteKpi({ libelle, valeur, sousTexte, illustration }: CarteKpiProps) {
  return (
    <Carte coin className="carte--kpi">
      {illustration ? <Icone nom={illustration} taille={110} className="kpi__illustration" /> : null}
      <div className="kpi">
        <span className="kpi__libelle">{libelle}</span>
        <span className="kpi__valeur">{valeur}</span>
        {sousTexte ? <span className="kpi__sous">{sousTexte}</span> : null}
      </div>
    </Carte>
  )
}
