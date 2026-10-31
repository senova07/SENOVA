import type { ChartePage, EmetteurDocument } from './types'

interface Props {
  charte: ChartePage
  emetteur: EmetteurDocument
}

/** Logo importé, sinon un logo neutre (goutte) aux couleurs de la charte. */
export function Logo({ charte, emetteur }: Props) {
  if (charte.logo) return <img className="doc-logo" data-taille={charte.tailleLogo} src={charte.logo} alt={`Logo ${emetteur.nom}`} />
  return (
    <svg className="doc-logo" data-taille={charte.tailleLogo} viewBox="0 0 48 52" role="img" aria-label={`Logo ${emetteur.nom}`}>
      <path className="doc-logo__goutte" d="M24 2c7 10 18 20 18 31a18 18 0 0 1-36 0C6 22 17 12 24 2Z" />
      <path className="doc-logo__flamme" d="M27 18c4 6 9 10 9 16a10 10 0 0 1-15 8.7c4.5-1.6 7.3-5.4 6-10.5C26.2 28.6 25 25 27 18Z" />
    </svg>
  )
}
