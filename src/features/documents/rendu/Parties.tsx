import { libelleClient } from './affichage'
import type { AdresseDocument, ClientDocument, DocumentRendu } from './types'

const ligneAdresse = (a: AdresseDocument) => `${a.codePostal} ${a.ville}`.trim()

export function CorpsClient({ client }: { client: ClientDocument | null }) {
  if (!client) return <div className="doc-partie__vide">Aucun client sélectionné</div>
  const nom = [client.civilite, client.nom].filter(Boolean).join(' ')
  return <div className="doc-partie__corps"><strong>{nom}</strong><br />{client.adresse.rue}<br />{ligneAdresse(client.adresse)}</div>
}

export function CorpsChantier({ document }: { document: DocumentRendu }) {
  const meme = !document.adresseChantier
  const adresse = document.adresseChantier ?? document.client?.adresse
  if (!adresse) return <div className="doc-partie__corps doc-discret">—</div>
  return (
    <div className="doc-partie__corps">
      {adresse.rue || '—'}<br />{ligneAdresse(adresse)}
      {meme && <span className="doc-partie__note">Même adresse que le client</span>}
    </div>
  )
}

interface Props {
  document: DocumentRendu
  /** « plan » : trois cases accolées, chantier et objet toujours présents. */
  variante?: 'plan'
}

/** Client, puis chantier s'il diffère. */
export function Parties({ document, variante }: Props) {
  const plan = variante === 'plan'
  return (
    <div className={plan ? 'doc-parties doc-parties--plan' : 'doc-parties'}>
      <div className="doc-partie"><div className="doc-etiquette">{libelleClient(document)}</div><CorpsClient client={document.client} /></div>
      {(plan || document.adresseChantier) && (
        <div className="doc-partie"><div className="doc-etiquette">{plan ? 'Chantier' : 'Adresse du chantier'}</div><CorpsChantier document={document} /></div>
      )}
      {plan && document.type !== 'avoir' && document.objet && (
        <div className="doc-partie"><div className="doc-etiquette">Objet des travaux</div><div className="doc-partie__corps">{document.objet}</div></div>
      )}
    </div>
  )
}
