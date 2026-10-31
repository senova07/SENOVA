import { metaDocument } from './affichage'
import { BlocTotaux } from './BlocTotaux'
import { Conditions } from './Conditions'
import { Emetteur } from './Emetteur'
import { Objet } from './Objet'
import { Parties } from './Parties'
import { PiedDePage } from './PiedDePage'
import { Reassurance } from './Reassurance'
import { TableauDocument } from './TableauDocument'
import { TitreDocument } from './TitreDocument'
import { CartesClient, ColonneLaterale, EnteteArtisan, EnteteBandeau, EnteteHero, EntetePlan } from './Variantes'
import { Zone } from './Zone'
import type { ChartePage, DocumentRendu } from './types'

interface Props {
  document: DocumentRendu
  charte: ChartePage
}

/** Tableau, totaux, conditions, réassurance (modèle Artisan) et pied : commun à tous les modèles. */
function Corps({ document, charte }: Props) {
  return (
    <>
      <Zone zone="lignes"><TableauDocument lignes={document.lignes} type={document.type} charte={charte} /></Zone>
      <Zone zone="totaux"><BlocTotaux document={document} charte={charte} /></Zone>
      <Zone zone="conditions"><Conditions document={document} charte={charte} /></Zone>
      {charte.modele === 'artisan' && <Reassurance mentions={document.mentions} />}
      <Zone zone="pied" variante="pied"><PiedDePage document={document} charte={charte} /></Zone>
    </>
  )
}

/** En-tête classique : émetteur à gauche, titre à droite. */
function EnteteStandard({ document, charte }: Props) {
  return (
    <Zone zone="entete">
      <div className="doc-entete"><Emetteur emetteur={document.emetteur} charte={charte} /><TitreDocument document={document} /></div>
    </Zone>
  )
}

const PartiesEtObjet = ({ document }: { document: DocumentRendu }) => (
  <>
    <Zone zone="client"><Parties document={document} /></Zone>
    <Objet document={document} />
  </>
)

/** Assemble les parties du document selon le modèle de la charte. */
export function MiseEnPage({ document, charte }: Props) {
  const corps = <Corps document={document} charte={charte} />
  switch (charte.modele) {
    case 'colonne':
      return (
        <>
          <ColonneLaterale document={document} charte={charte} />
          <div className="doc-principal">
            <div className="doc-principal__titre">
              <div className="doc-titre__type">{metaDocument(document).titre}</div>
              <div className="doc-titre__numero">N° {document.numero}</div>
            </div>
            <Objet document={document} />
            {corps}
          </div>
        </>
      )
    case 'hero':
      return <><EnteteHero document={document} charte={charte} /><PartiesEtObjet document={document} />{corps}</>
    case 'bandeau':
      return <><EnteteBandeau document={document} charte={charte} /><PartiesEtObjet document={document} />{corps}</>
    case 'artisan':
      return <><EnteteArtisan document={document} charte={charte} /><PartiesEtObjet document={document} />{corps}</>
    case 'plan':
      return (
        <>
          <span className="doc-quadrillage" aria-hidden />
          <EntetePlan document={document} charte={charte} />
          <Zone zone="client"><Parties document={document} variante="plan" /></Zone>
          {corps}
        </>
      )
    case 'bloc-client':
      return (
        <>
          <EnteteStandard document={document} charte={charte} />
          <Zone zone="client"><CartesClient document={document} /></Zone>
          {corps}
        </>
      )
    default: // classique-pro, epure
      return (
        <>
          {charte.modele === 'classique-pro' && <span className="doc-coin" aria-hidden />}
          <EnteteStandard document={document} charte={charte} />
          <PartiesEtObjet document={document} />
          {corps}
        </>
      )
  }
}
