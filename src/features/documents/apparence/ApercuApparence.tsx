import { useState } from 'react'
import { BarreApercu, ZoneApercu } from '@/ui/ApercuAtelier'
import { useEchelleApercu, type ModeZoom } from '@/ui/AtelierFonctions'
import { ControleSegmente } from '@/ui/ControleSegmente'
import { ApercuDocument, type ChartePage, type TypeDocument, type ZoneDocument } from '../rendu'
import type { ReglagesDocuments } from '../api'
import { documentApercu, type OrganisationDocument } from './reglages'

interface Props {
  charte: ChartePage
  reglages: ReglagesDocuments
  organisation: OrganisationDocument
  onCibler(zone: ZoneDocument): void
}

const TYPES = [
  { id: 'devis', libelle: 'Devis' },
  { id: 'facture', libelle: 'Facture' },
  { id: 'avoir', libelle: 'Avoir' },
] as const satisfies readonly { id: TypeDocument; libelle: string }[]

/** Colonne de droite : le document d'exemple, décliné par type, avec la vraie organisation comme émetteur. */
export function ApercuApparence({ charte, reglages, organisation, onCibler }: Props) {
  const [type, setType] = useState<TypeDocument>('devis')
  const [zoom, setZoom] = useState<ModeZoom>('ajuster')
  const { zoneRef, echelle } = useEchelleApercu(zoom)

  return (
    <>
      <BarreApercu
        zoom={zoom}
        echelle={echelle}
        onZoom={setZoom}
        gauche={<ControleSegmente<TypeDocument> libelle="Type de document" options={TYPES} valeur={type} onChoisir={setType} />}
      />
      <ZoneApercu echelle={echelle} ref={zoneRef}>
        <ApercuDocument document={documentApercu(type, organisation, reglages)} charte={charte} echelle={echelle} onCibler={onCibler} />
      </ZoneApercu>
    </>
  )
}
