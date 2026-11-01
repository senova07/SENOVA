import { SectionAtelier } from '@/ui/Atelier'
import { ControleSegmente } from '@/ui/ControleSegmente'
import { ChampZone } from '@/ui/Formulaire'
import { Interrupteur } from '@/ui/Interrupteur'
import type { ChartePage } from '../rendu'
import { SECTIONS } from './sections'
import type { ModifierCharte } from './types'

interface Props {
  charte: ChartePage
  onCharte: ModifierCharte
}

const TAILLES = [{ id: 'S', libelle: 'Petit' }, { id: 'M', libelle: 'Moyen' }, { id: 'L', libelle: 'Grand' }] as const
const POSITIONS = [{ id: 'gauche', libelle: 'Gauche' }, { id: 'centre', libelle: 'Centre' }] as const
const NOMS_TAILLE = { S: 'petit', M: 'moyen', L: 'grand' } as const

export function SectionEntete({ charte, onCharte }: Props) {
  return (
    <SectionAtelier
      id={SECTIONS.entete}
      numero={5}
      titre="En-tête et pied de page"
      resume={`Logo ${NOMS_TAILLE[charte.tailleLogo]} · ${charte.alignementLogo === 'gauche' ? 'à gauche' : 'centré'}`}
    >
      <div className="apparence-grille">
        <div className="apparence-champ">
          <span className="apparence-sous-titre">Taille du logo</span>
          <ControleSegmente libelle="Taille du logo" options={TAILLES} valeur={charte.tailleLogo} onChoisir={(tailleLogo) => onCharte({ tailleLogo })} />
        </div>
        <div className="apparence-champ">
          <span className="apparence-sous-titre">Position du logo</span>
          <ControleSegmente libelle="Position du logo" options={POSITIONS} valeur={charte.alignementLogo} onChoisir={(alignementLogo) => onCharte({ alignementLogo })} />
        </div>
      </div>
      <Interrupteur
        libelle="Afficher les coordonnées de l’entreprise"
        aide="Adresse, téléphone et e-mail sous le logo"
        checked={charte.afficherContact}
        onChange={(e) => onCharte({ afficherContact: e.target.checked })}
      />
      <ChampZone
        libelle="Texte du pied de page"
        rows={2}
        value={charte.piedDePage}
        onChange={(e) => onCharte({ piedDePage: e.target.value }, 'pied')}
      />
      <Interrupteur
        libelle="Mentions légales en bas de page"
        aide="SIRET, TVA, assurance… (voir « Mentions légales »)"
        checked={charte.afficherMentionsLegales}
        onChange={(e) => onCharte({ afficherMentionsLegales: e.target.checked })}
      />
    </SectionAtelier>
  )
}
