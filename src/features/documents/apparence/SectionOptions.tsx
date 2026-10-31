import { SectionAtelier } from '@/ui/Atelier'
import { Interrupteur } from '@/ui/Interrupteur'
import type { ChartePage, OptionsAffichage } from '../rendu'
import { SECTIONS } from './sections'
import type { ModifierCharte } from './types'

interface Props {
  charte: ChartePage
  onCharte: ModifierCharte
}

const OPTIONS: readonly { cle: keyof OptionsAffichage; libelle: string; aide: string }[] = [
  { cle: 'afficherReferences', libelle: 'Afficher les références', aide: 'Colonne « Réf. » dans le tableau' },
  { cle: 'afficherUnites', libelle: 'Afficher les unités', aide: 'heure, forfait, m²…' },
  { cle: 'regrouperSections', libelle: 'Regrouper par section', aide: 'Titres « Salle de bain », « Cuisine »…' },
  { cle: 'afficherSignature', libelle: 'Zone « Bon pour accord »', aide: 'Pour la signature du client sur les devis' },
  { cle: 'afficherQr', libelle: 'QR code de paiement', aide: 'Illustratif : le paiement par QR code n’est pas encore branché' },
]

export function SectionOptions({ charte, onCharte }: Props) {
  return (
    <SectionAtelier id={SECTIONS.options} numero={8} titre="Options d’affichage" resume={`${Object.values(charte.options).filter(Boolean).length} activées`}>
      {OPTIONS.map((o) => (
        <Interrupteur
          key={o.cle}
          libelle={o.libelle}
          aide={o.aide}
          checked={charte.options[o.cle]}
          onChange={(e) => onCharte({ options: { ...charte.options, [o.cle]: e.target.checked } })}
        />
      ))}
    </SectionAtelier>
  )
}
