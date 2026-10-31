import { metaDocument } from './affichage'
import type { DocumentRendu } from './types'

/** Type, numéro et dates du document. */
export function TitreDocument({ document }: { document: DocumentRendu }) {
  const meta = metaDocument(document)
  return (
    <div className="doc-titre">
      <div className="doc-titre__type">{meta.titre}</div>
      <div className="doc-titre__numero">N° {document.numero}</div>
      <dl className="doc-titre__meta">
        {meta.lignes.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </div>
  )
}
