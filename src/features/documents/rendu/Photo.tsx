import type { ChartePage } from './types'

interface Props {
  charte: ChartePage
  className: string
}

/** Photo de réalisation ; sans photo, motif à facettes aux couleurs du document (aucune image générée). */
export function Photo({ charte, className }: Props) {
  if (charte.photo) return <div className={className}><img src={charte.photo} alt="Réalisation de l’entreprise" /></div>
  return (
    <div className={className}>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="400" height="260" className="doc-facette doc-facette--p1" />
        <polygon points="0,260 150,90 260,260" className="doc-facette doc-facette--p2" />
        <polygon points="120,0 400,0 400,150 250,210" className="doc-facette doc-facette--p3" />
        <polygon points="250,210 400,150 400,260 300,260" className="doc-facette doc-facette--a1" />
        <polygon points="150,90 250,210 260,260" className="doc-facette doc-facette--a2" />
        <polygon points="0,0 120,0 150,90 0,170" className="doc-facette doc-facette--p4" />
        <polygon points="330,0 400,0 400,70" className="doc-facette doc-facette--a3" />
        <polygon points="300,260 400,150 400,185 335,260" className="doc-facette doc-facette--p5" />
      </svg>
    </div>
  )
}
