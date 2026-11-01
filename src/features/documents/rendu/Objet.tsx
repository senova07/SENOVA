import { Zone } from './Zone'
import type { DocumentRendu } from './types'

/** Objet du devis ou de la facture ; rien pour un avoir ou sans objet. */
export function Objet({ document }: { document: DocumentRendu }) {
  if (document.type === 'avoir' || !document.objet) return null
  return <Zone zone="informations"><p className="doc-objet"><span>Objet :</span> {document.objet}</p></Zone>
}
