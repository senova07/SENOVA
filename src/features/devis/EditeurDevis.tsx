import { useMemo, useState } from 'react'
import type { ZoneDocument } from '@/features/documents'
import { Atelier, SectionAtelier } from '@/ui/Atelier'
import { allerASection } from '@/ui/AtelierFonctions'
import { EntetePage } from '@/ui/EntetePage'
import { formaterEuro } from '@/lib/format'
import { useSession } from '@/store/sessionContext'
import { ApercuEditeur } from './ApercuEditeur'
import { PiedEditeur } from './PiedEditeur'
import { SectionClient } from './SectionClient'
import { SectionConditions } from './SectionConditions'
import { SectionInformations } from './SectionInformations'
import { SectionLignes } from './SectionLignes'
import { SectionRecap } from './SectionRecap'
import { totauxDevis } from './calculs'
import { LIBELLES_STATUT_DEVIS, STATUTS_FIGES } from './statuts'
import type { Devis } from './types'
import { useBrouillonDevis } from './useBrouillonDevis'
import { versDocument } from './versDocument'
import './devis.css'

/** Zone cliquée dans l'aperçu → section du formulaire à ouvrir. */
const SECTION_DE_ZONE: Record<ZoneDocument, string> = {
  entete: 'devis-s-infos',
  informations: 'devis-s-infos',
  client: 'devis-s-client',
  lignes: 'devis-s-lignes',
  totaux: 'devis-s-recap',
  conditions: 'devis-s-conditions',
  pied: 'devis-s-conditions',
}

export function EditeurDevis({ initial }: { initial: Devis }) {
  const { session } = useSession()
  const { devis, modifier, enregistrer, etat } = useBrouillonDevis(initial)
  const [volet, setVolet] = useState<'modification' | 'apercu'>('modification')

  const totaux = useMemo(() => totauxDevis(devis), [devis])
  const document = useMemo(
    () => versDocument(devis, session?.organisation ?? null),
    [devis, session?.organisation],
  )
  const fige = STATUTS_FIGES.includes(devis.statut)
  const brouillon = devis.statut === 'brouillon'
  // Jamais rempli à l'ouverture : « Nouveau devis » (le titre ne change pas pendant la saisie).
  const [nouveau] = useState(
    () => initial.statut === 'brouillon' && !initial.objet && !initial.clientNom && initial.lignes.length === 0,
  )
  const nbArticles = devis.lignes.filter((l) => l.genre === 'article').length

  // Sous 1200 px, l'aperçu masque le formulaire : on revient d'abord à « Modification ».
  const cibler = (zone: ZoneDocument) => {
    setVolet('modification')
    allerASection(SECTION_DE_ZONE[zone])
  }

  const formulaire = (
    <>
      {fige ? (
        <p className="devis-bandeau" role="note">
          Ce devis est {LIBELLES_STATUT_DEVIS[devis.statut].toLowerCase()} : il n’est plus modifiable.
          Dupliquez-le depuis la liste pour en créer une nouvelle version.
        </p>
      ) : null}
      <SectionAtelier
        id="devis-s-client"
        numero={1}
        titre="Client"
        ouverteParDefaut
        statut={devis.clientNom ? 'fait' : undefined}
        resume={devis.clientNom || 'À choisir'}
      >
        <SectionClient devis={devis} lectureSeule={fige} onModifier={modifier} />
      </SectionAtelier>
      <SectionAtelier id="devis-s-infos" numero={2} titre="Informations" ouverteParDefaut resume={devis.objet || devis.numero}>
        <SectionInformations devis={devis} lectureSeule={fige} onModifier={modifier} />
      </SectionAtelier>
      <SectionAtelier
        id="devis-s-lignes"
        numero={3}
        titre="Lignes"
        ouverteParDefaut
        resume={`${nbArticles} article${nbArticles > 1 ? 's' : ''} · ${formaterEuro(totaux.totalHt)} HT`}
      >
        <SectionLignes lignes={devis.lignes} lectureSeule={fige} onLignes={(lignes) => modifier({ lignes })} />
      </SectionAtelier>
      <SectionAtelier
        id="devis-s-conditions"
        numero={4}
        titre="Conditions"
        resume={devis.acomptePourcent ? `Acompte ${devis.acomptePourcent} %` : 'Sans acompte'}
      >
        <SectionConditions devis={devis} totaux={totaux} lectureSeule={fige} onModifier={modifier} />
      </SectionAtelier>
      <SectionAtelier id="devis-s-recap" numero={5} titre="Récapitulatif" resume={`${formaterEuro(totaux.totalTtc)} TTC`}>
        <SectionRecap totaux={totaux} acomptePourcent={devis.acomptePourcent} />
      </SectionAtelier>
    </>
  )

  return (
    <Atelier
      entete={
        <EntetePage
          titre={nouveau ? 'Nouveau devis' : 'Devis'}
          complement={devis.numero}
          filAriane={[
            { libelle: 'Ventes', vers: '/devis' },
            { libelle: 'Devis', vers: '/devis' },
            { libelle: nouveau ? 'Nouveau devis' : devis.numero },
          ]}
        />
      }
      formulaire={formulaire}
      apercu={<ApercuEditeur document={document} onCibler={cibler} />}
      pied={<PiedEditeur etat={etat} fige={fige} brouillon={brouillon} onEnregistrer={() => void enregistrer()} />}
      volet={volet}
      onVolet={setVolet}
    />
  )
}
