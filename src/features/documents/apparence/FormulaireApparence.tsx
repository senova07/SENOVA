import type { ReglagesDocuments } from '../api'
import type { ChartePage, DocumentRendu } from '../rendu'
import { CarteProgression } from './CarteProgression'
import type { Progression } from './progression'
import type { IdSection } from './sections'
import { SectionEntete } from './SectionEntete'
import { SectionLogoCouleurs } from './SectionLogoCouleurs'
import { SectionMentions } from './SectionMentions'
import { SectionModele } from './SectionModele'
import { SectionOptions } from './SectionOptions'
import { SectionPolice } from './SectionPolice'
import { SectionTableau } from './SectionTableau'
import { SectionTextes } from './SectionTextes'
import type { ModifierCharte, ModifierReglages } from './types'

interface Props {
  charte: ChartePage
  /** Charte différée pour les miniatures : elles se redessinent sans bloquer la roue. */
  vignettes: ChartePage
  reglages: ReglagesDocuments
  exemple: DocumentRendu
  progression: Progression
  nomEntreprise: string
  adresse: string
  onCharte: ModifierCharte
  onReglages: ModifierReglages
  complement?: string
  onAller(section: IdSection): void
  /** Fin d'un geste continu (pointerup, blur) : sépare les étapes d'annulation. */
  onClore(): void
}

/** Colonne de gauche : progression puis les huit sections numérotées. */
export function FormulaireApparence({ charte, vignettes, reglages, exemple, progression, nomEntreprise, complement, adresse, onCharte, onReglages, onAller, onClore }: Props) {
  return (
    <div className="apparence-form" onBlur={onClore} onPointerUp={onClore}>
      <CarteProgression progression={progression} onAller={onAller} />
      <SectionLogoCouleurs charte={charte} nomEntreprise={nomEntreprise} complement={complement} onCharte={onCharte} />
      <SectionModele charte={charte} vignettes={vignettes} exemple={exemple} onCharte={onCharte} />
      <SectionTableau charte={charte} vignettes={vignettes} exemple={exemple} onCharte={onCharte} />
      <SectionPolice charte={charte} onCharte={onCharte} />
      <SectionEntete charte={charte} onCharte={onCharte} />
      <SectionMentions reglages={reglages} adresse={adresse} onReglages={onReglages} />
      <SectionTextes reglages={reglages} onReglages={onReglages} />
      <SectionOptions charte={charte} onCharte={onCharte} />
    </div>
  )
}
