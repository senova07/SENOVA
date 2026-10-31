import type { CSSProperties } from 'react'
import { SectionAtelier } from '@/ui/Atelier'
import { POLICES, type ChartePage, type PoliceId } from '../rendu'
import { GalerieChoix } from './GalerieChoix'
import { SECTIONS } from './sections'
import type { ModifierCharte } from './types'

interface Props {
  charte: ChartePage
  onCharte: ModifierCharte
}

export function SectionPolice({ charte, onCharte }: Props) {
  const courante = POLICES.find((p) => p.id === charte.police)
  return (
    <SectionAtelier id={SECTIONS.police} numero={4} titre="Police" resume={courante?.libelle}>
      <GalerieChoix<PoliceId>
        libelle="Police du document"
        variante="galerie--polices"
        valeur={charte.police}
        onChoisir={(police) => onCharte({ police })}
        options={POLICES.map((p) => ({
          id: p.id,
          libelle: p.libelle,
          vignette: (
            <span className="echantillon-police" style={{ '--police': p.famille } as CSSProperties} aria-hidden="true">
              <b>Aa</b>
              <span>Devis n° 42</span>
            </span>
          ),
        }))}
      />
    </SectionAtelier>
  )
}
