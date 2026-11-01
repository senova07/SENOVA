import { useMemo } from 'react'
import { SectionAtelier } from '@/ui/Atelier'
import { ApercuDocument, MODELES_PAGE, type ChartePage, type DocumentRendu, type ModelePageId } from '../rendu'
import { ChampImage } from './ChampImage'
import { GalerieChoix } from './GalerieChoix'
import { REGLE_PHOTO } from './image'
import { SECTIONS } from './sections'
import type { ModifierCharte } from './types'

interface Props {
  charte: ChartePage
  vignettes: ChartePage
  /** Document d'exemple affiché dans les miniatures. */
  exemple: DocumentRendu
  onCharte: ModifierCharte
}

const ECHELLE_MINIATURE = 0.142

export function SectionModele({ charte, vignettes, exemple, onCharte }: Props) {
  const courant = MODELES_PAGE.find((m) => m.id === charte.modele)
  // Mémoïsé : les miniatures ne se redessinent que si `vignettes` ou `exemple` changent, pas à chaque modification du formulaire.
  const options = useMemo(
    () =>
      MODELES_PAGE.map((m) => ({
        id: m.id,
        libelle: m.libelle,
        description: m.description,
        recommande: m.recommande,
        vignette: <ApercuDocument document={exemple} charte={{ ...vignettes, modele: m.id }} echelle={ECHELLE_MINIATURE} miniature />,
      })),
    [vignettes, exemple],
  )
  return (
    <SectionAtelier id={SECTIONS.modele} numero={2} titre="Modèle de mise en page" resume={courant?.libelle}>
      <p className="apparence-aide">Les modèles conseillés conviennent à la plupart des artisans. Vos couleurs, votre logo et votre police s’appliquent à tous.</p>
      <GalerieChoix<ModelePageId>
        libelle="Modèle de mise en page"
        variante="galerie--modeles"
        valeur={charte.modele}
        onChoisir={(modele) => onCharte({ modele })}
        options={options}
      />
      {courant?.photo ? (
        <div className="photo-ligne">
          <div className="photo-ligne__texte">
            <strong>Photo de réalisation <small>(facultatif)</small></strong>
            <span>Une photo d’un de vos chantiers. Sans photo, un motif à vos couleurs la remplace.</span>
          </div>
          {charte.photo ? <img className="photo-ligne__apercu" src={charte.photo} alt="Photo de réalisation" /> : null}
          <ChampImage nom="photo" valeur={charte.photo} regle={REGLE_PHOTO} onChoisir={(photo) => onCharte({ photo })} onRetirer={() => onCharte({ photo: undefined })} />
        </div>
      ) : null}
    </SectionAtelier>
  )
}
