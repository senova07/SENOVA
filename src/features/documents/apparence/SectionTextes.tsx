import { SectionAtelier } from '@/ui/Atelier'
import { ChampTexte, ChampZone } from '@/ui/Formulaire'
import type { ReglagesDocuments } from '../api'
import type { TextesDocument } from '../rendu'
import { SECTIONS } from './sections'
import type { ModifierReglages } from './types'

interface Props {
  reglages: ReglagesDocuments
  onReglages: ModifierReglages
}

const TEXTES: readonly { cle: keyof TextesDocument; libelle: string; lignes: number }[] = [
  { cle: 'conditions', libelle: 'Conditions générales', lignes: 3 },
  { cle: 'validite', libelle: 'Validité du devis', lignes: 2 },
  { cle: 'penalites', libelle: 'Pénalités de retard (factures)', lignes: 2 },
  { cle: 'indemnite', libelle: 'Indemnité forfaitaire de recouvrement (clients professionnels)', lignes: 2 },
  { cle: 'remerciement', libelle: 'Message de remerciement', lignes: 1 },
]

export function SectionTextes({ reglages, onReglages }: Props) {
  const maj = (cle: keyof TextesDocument, valeur: string) => onReglages({ textes: { ...reglages.textes, [cle]: valeur } }, `texte:${cle}`)
  return (
    <SectionAtelier id={SECTIONS.textes} numero={7} titre="Textes par défaut" resume="Conditions, remerciement…">
      <ChampTexte
        libelle="Conditions de paiement"
        value={reglages.conditionsPaiement}
        onChange={(e) => onReglages({ conditionsPaiement: e.target.value }, 'texte:paiement')}
      />
      {TEXTES.map((t) =>
        t.lignes === 1 ? (
          <ChampTexte key={t.cle} libelle={t.libelle} value={reglages.textes[t.cle]} onChange={(e) => maj(t.cle, e.target.value)} />
        ) : (
          <ChampZone key={t.cle} libelle={t.libelle} rows={t.lignes} value={reglages.textes[t.cle]} onChange={(e) => maj(t.cle, e.target.value)} />
        ),
      )}
    </SectionAtelier>
  )
}
