import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApercuDocument, useCharteAppliquee, type DocumentRendu, type ZoneDocument } from '@/features/documents'
import { BarreApercu, ZoneApercu } from '@/ui/Atelier'
import { useEchelleApercu, type ModeZoom } from '@/ui/AtelierFonctions'
import { Icone } from '@/ui/Icone'

interface Props {
  document: DocumentRendu
  onCibler(zone: ZoneDocument): void
}

/** Aperçu A4 en direct avec la charte appliquée, zoom, et lien vers l'écran Apparence. */
export function ApercuEditeur({ document, onCibler }: Props) {
  const charte = useCharteAppliquee()
  const [zoom, setZoom] = useState<ModeZoom>('ajuster')
  const { zoneRef, echelle } = useEchelleApercu(zoom)

  return (
    <>
      <BarreApercu
        zoom={zoom}
        echelle={echelle}
        onZoom={setZoom}
        droite={
          <Link to="/documents/apparence" className="btn btn--secondary btn--sm">
            <Icone nom="palette" taille={16} /> Modifier l’apparence
          </Link>
        }
      />
      <ZoneApercu echelle={echelle} ref={zoneRef}>
        <ApercuDocument document={document} charte={charte} echelle={echelle} onCibler={onCibler} />
      </ZoneApercu>
    </>
  )
}
