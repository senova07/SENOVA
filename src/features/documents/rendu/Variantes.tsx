import { CalendarBlankIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, UserIcon } from '@phosphor-icons/react'
import { libelleClient, metaDocument } from './affichage'
import { Contact, Emetteur } from './Emetteur'
import { Logo } from './Logo'
import { CorpsChantier, CorpsClient } from './Parties'
import { Photo } from './Photo'
import { TitreDocument } from './TitreDocument'
import { Zone } from './Zone'
import type { ChartePage, DocumentRendu } from './types'

interface Props {
  document: DocumentRendu
  charte: ChartePage
}

/* Éléments propres à certains modèles ; `MiseEnPage` les assemble. */

export function ColonneLaterale({ document, charte }: Props) {
  const { emetteur } = document
  const meta = metaDocument(document)
  return (
    <aside className="doc-colonne">
      <Zone zone="entete">
        <div className="doc-colonne__marque">
          <div className="doc-plaque"><Logo charte={charte} emetteur={emetteur} /></div>
          <div className="doc-societe__nom">{emetteur.nom}</div>
          <div className="doc-societe__activite">{emetteur.activite}</div>
        </div>
      </Zone>
      {charte.afficherContact && (
        <ul className="doc-colonne__liste">
          <li><MapPinIcon size={13} aria-hidden /><span>{emetteur.adresse.rue}<br />{emetteur.adresse.codePostal} {emetteur.adresse.ville}</span></li>
          <li><PhoneIcon size={13} aria-hidden /><span>{emetteur.telephone}</span></li>
          <li><EnvelopeSimpleIcon size={13} aria-hidden /><span>{emetteur.email}</span></li>
        </ul>
      )}
      <Zone zone="client">
        <div className="doc-colonne__blocs">
          <div><div className="doc-colonne__etiquette">{libelleClient(document)}</div><CorpsClient client={document.client} /></div>
          <div><div className="doc-colonne__etiquette">Chantier</div><CorpsChantier document={document} /></div>
          <div>
            <div className="doc-colonne__etiquette">Dates</div>
            {meta.lignes.map(([k, v]) => <div key={k} className="doc-colonne__kv"><span>{k}</span><strong>{v}</strong></div>)}
          </div>
        </div>
      </Zone>
    </aside>
  )
}

export function EnteteHero({ document, charte }: Props) {
  const { emetteur } = document
  return (
    <Zone zone="entete" variante="pleine">
      <div className="doc-hero">
        <Photo charte={charte} className="doc-hero__photo" />
        <div className="doc-hero__barre">
          <div className="doc-plaque"><Logo charte={charte} emetteur={emetteur} /></div>
          <div className="doc-hero__societe">
            <div className="doc-societe__nom">{emetteur.nom}</div>
            <div className="doc-societe__activite">{emetteur.activite}</div>
            <Contact emetteur={emetteur} charte={charte} />
          </div>
          <TitreDocument document={document} />
        </div>
      </div>
    </Zone>
  )
}

export function EnteteBandeau({ document, charte }: Props) {
  const { emetteur } = document
  return (
    <>
      <Zone zone="entete" variante="pleine">
        <div className="doc-bandeau">
          <div className="doc-plaque"><Logo charte={charte} emetteur={emetteur} /></div>
          <div className="doc-bandeau__societe">
            <div className="doc-societe__nom">{emetteur.nom}</div>
            <div className="doc-societe__activite">{emetteur.activite}</div>
          </div>
          <TitreDocument document={document} />
        </div>
      </Zone>
      {charte.afficherContact && (
        <div className="doc-bandeau__contact">
          {emetteur.adresse.rue}, {emetteur.adresse.codePostal} {emetteur.adresse.ville} · {emetteur.telephone} · {emetteur.email}
        </div>
      )}
    </>
  )
}

export function EnteteArtisan({ document, charte }: Props) {
  return (
    <Zone zone="entete" variante="pleine">
      <div className="doc-artisan">
        <div className="doc-artisan__gauche">
          <Emetteur emetteur={document.emetteur} charte={charte} />
          <TitreDocument document={document} />
        </div>
        <Photo charte={charte} className="doc-artisan__photo" />
      </div>
    </Zone>
  )
}

export function EntetePlan({ document, charte }: Props) {
  const meta = metaDocument(document)
  return (
    <Zone zone="entete">
      <div className="doc-entete">
        <Emetteur emetteur={document.emetteur} charte={charte} />
        <div className="doc-cartouche">
          <div className="doc-cartouche__titre">{meta.titre}</div>
          <div className="doc-cartouche__cellule"><span>N°</span><strong>{document.numero}</strong></div>
          {meta.lignes.map(([k, v]) => <div key={k} className="doc-cartouche__cellule"><span>{k}</span><strong>{v}</strong></div>)}
        </div>
      </div>
    </Zone>
  )
}

export function CartesClient({ document }: { document: DocumentRendu }) {
  const meta = metaDocument(document)
  const avoir = document.type === 'avoir'
  return (
    <div className="doc-cartes">
      <div className="doc-cartes__item">
        <UserIcon size={18} aria-hidden />
        <div><div className="doc-etiquette">{libelleClient(document)}</div><CorpsClient client={document.client} /></div>
      </div>
      <div className="doc-cartes__item">
        <MapPinIcon size={18} aria-hidden />
        <div><div className="doc-etiquette">Adresse du chantier</div><CorpsChantier document={document} /></div>
      </div>
      <div className="doc-cartes__item">
        <CalendarBlankIcon size={18} aria-hidden />
        <div>
          <div className="doc-etiquette">{avoir ? 'Avoir' : 'Travaux'}</div>
          <div className="doc-partie__corps">
            <strong>{!avoir && document.objet ? document.objet : `${meta.titre} ${document.numero}`}</strong>
            {meta.lignes.map(([k, v]) => <div key={k}>{k} : {v}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
