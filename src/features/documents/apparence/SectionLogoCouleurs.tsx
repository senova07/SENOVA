import { useState, type CSSProperties } from 'react'
import { Icone } from '@/ui/Icone'
import { SectionAtelier } from '@/ui/Atelier'
import type { ChartePage } from '../rendu'
import { ChampCouleur } from './ChampCouleur'
import { ChampImage } from './ChampImage'
import { avertissementsContraste } from './contraste'
import { REGLE_LOGO } from './image'
import { PalettesCouleurs } from './PalettesCouleurs'
import { RoueChromatique } from './RoueChromatique'
import { SECTIONS } from './sections'
import { usePalettesLogo } from './usePalettesLogo'
import type { ModifierCharte } from './types'

interface Props {
  charte: ChartePage
  nomEntreprise: string
  /** Sous le nom dans la boîte du logo (forme juridique : la session ne connaît pas l'activité). */
  complement?: string
  onCharte: ModifierCharte
}

type Cible = 'couleurPrincipale' | 'couleurAccent'

export function SectionLogoCouleurs({ charte, nomEntreprise, complement, onCharte }: Props) {
  const { palettes: palettesLogo, repli } = usePalettesLogo(charte.logo)
  const [cible, setCible] = useState<Cible>('couleurPrincipale')
  const alertes = avertissementsContraste(charte)
  const libelleCible = cible === 'couleurPrincipale' ? 'Couleur principale' : 'Couleur d’accent'

  const champ = (role: Cible, libelle: string, aide: string, alerte: boolean) => (
    <ChampCouleur
      libelle={libelle}
      aide={aide}
      valeur={charte[role]}
      actif={cible === role}
      alerte={alerte}
      onSelect={() => setCible(role)}
      onChange={(hex) => onCharte({ [role]: hex }, `couleur:${role}`)}
    />
  )

  return (
    <SectionAtelier
      id={SECTIONS.logo}
      numero={1}
      titre="Logo et couleurs"
      ouverteParDefaut
      statut={alertes.length ? 'alerte' : 'fait'}
      resume={
        <span className="resume-pastilles">
          <i style={{ '--c': charte.couleurPrincipale } as CSSProperties} />
          <i style={{ '--c': charte.couleurAccent } as CSSProperties} />
        </span>
      }
    >
      <div className="logo-ligne">
        <div className="logo-boite">
          {charte.logo ? <img src={charte.logo} alt="Votre logo" /> : <Icone nom="image" taille={26} />}
          <div>
            <strong>{nomEntreprise}</strong>
            {complement ? <small>{complement}</small> : null}
          </div>
        </div>
        <ChampImage nom="logo" valeur={charte.logo} regle={REGLE_LOGO} onChoisir={(logo) => onCharte({ logo })} onRetirer={() => onCharte({ logo: undefined })} />
      </div>
      <p className="apparence-aide apparence-aide--icone">
        <Icone nom="image" taille={14} />
        {REGLE_LOGO.formats}, {Math.round(REGLE_LOGO.tailleMax / 1024 / 1024)} Mo maximum. Un logo sur fond transparent rend mieux sur les modèles colorés.
      </p>
      {repli ? <p className="apparence-aide">Les couleurs de ce logo n’ont pas pu être lues : voici des palettes par défaut.</p> : null}

      <PalettesCouleurs principale={charte.couleurPrincipale} accent={charte.couleurAccent} palettesLogo={palettesLogo} onCharte={onCharte} />

      <div className="apparence-bloc">
        <span className="apparence-sous-titre">Personnaliser vos couleurs</span>
        <div className="couleurs-perso">
          <div className="couleurs-perso__champs">
            {champ('couleurPrincipale', 'Couleur principale', 'Titres, totaux, en-têtes', alertes.some((a) => a.role === 'principale'))}
            {champ('couleurAccent', 'Couleur d’accent', 'Détails et bandeaux', alertes.some((a) => a.role === 'accent'))}
          </div>
          <RoueChromatique libelle={libelleCible} valeur={charte[cible]} onChange={(hex) => onCharte({ [cible]: hex }, `couleur:${cible}`)} />
        </div>
        {alertes.map((a) => (
          <p key={a.role} className="apparence-alerte" role="alert">
            <Icone nom="attention" taille={16} poids="fill" />
            {a.message}
          </p>
        ))}
      </div>
    </SectionAtelier>
  )
}
