import { useMemo, type CSSProperties } from 'react'
import { SectionAtelier } from '@/ui/Atelier'
import { STYLES_TABLEAU, TableauDocument, variablesCharte, type ChartePage, type DocumentRendu, type StyleTableauId } from '../rendu'
import { GalerieChoix } from './GalerieChoix'
import { SECTIONS } from './sections'
import type { ModifierCharte } from './types'

interface Props {
  charte: ChartePage
  vignettes: ChartePage
  exemple: DocumentRendu
  onCharte: ModifierCharte
}

/** Le vrai tableau du document, réduit à la largeur de la tuile (les couleurs viennent des variables `--doc-*`). */
function VignetteTableau({ charte, exemple, style }: { charte: ChartePage; exemple: DocumentRendu; style: StyleTableauId }) {
  return (
    <span className="vignette-tableau" style={variablesCharte(charte) as CSSProperties} aria-hidden="true">
      <span className="vignette-tableau__contenu">
        <TableauDocument lignes={exemple.lignes.slice(0, 6)} type="devis" charte={{ ...charte, styleTableau: style, options: { ...charte.options, afficherReferences: false } }} />
      </span>
    </span>
  )
}

export function SectionTableau({ charte, vignettes, exemple, onCharte }: Props) {
  const courant = STYLES_TABLEAU.find((s) => s.id === charte.styleTableau)
  const options = useMemo(
    () =>
      STYLES_TABLEAU.map((s) => ({
        id: s.id,
        libelle: s.libelle,
        description: s.description,
        recommande: s.recommande,
        vignette: <VignetteTableau charte={vignettes} exemple={exemple} style={s.id} />,
      })),
    [vignettes, exemple],
  )
  return (
    <SectionAtelier id={SECTIONS.tableau} numero={3} titre="Style de vos tableaux" resume={courant?.libelle}>
      <p className="apparence-aide">Indépendant du modèle : combinez librement. Aperçu avec vos premières lignes.</p>
      <GalerieChoix<StyleTableauId>
        libelle="Style de tableau"
        variante="galerie--tableaux"
        valeur={charte.styleTableau}
        onChoisir={(styleTableau) => onCharte({ styleTableau })}
        options={options}
      />
    </SectionAtelier>
  )
}
