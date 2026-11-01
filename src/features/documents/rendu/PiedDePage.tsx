import type { ChartePage, DocumentRendu } from './types'

/** Ligne légale : forme, capital, SIRET, registre, TVA, assurance décennale. */
function ligneLegale({ emetteur, mentions: m }: DocumentRendu): string {
  const assurance = m.assureur
    && `Assurance décennale ${m.assureur}${m.contratAssurance ? ` n° ${m.contratAssurance}` : ''}${m.zoneAssurance ? `, ${m.zoneAssurance}` : ''}`
  return [
    emetteur.nom,
    [m.formeJuridique, m.capital && `au capital de ${m.capital}`].filter(Boolean).join(' '),
    m.siret && `SIRET ${m.siret}`,
    m.registre,
    m.numeroTva && `TVA ${m.numeroTva}`,
    assurance,
  ].filter(Boolean).join(' · ')
}

export function PiedDePage({ document, charte }: { document: DocumentRendu; charte: ChartePage }) {
  return (
    <footer className="doc-pied">
      {charte.piedDePage && <p>{charte.piedDePage}</p>}
      {charte.afficherMentionsLegales && <p className="doc-pied__legal">{ligneLegale(document)}</p>}
    </footer>
  )
}
