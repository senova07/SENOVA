import type { CSSProperties } from 'react'
import { variablesCharte } from './charte'
import { ContexteCible } from './contexteCible'
import { MiseEnPage } from './MiseEnPage'
import { usePagesA4 } from './usePagesA4'
import type { ChartePage, DocumentRendu, ZoneDocument } from './types'
import './doc.css'

interface Props {
  document: DocumentRendu
  charte: ChartePage
  /** Facteur d'affichage de la page A4 (1 = 794 px de large). */
  echelle?: number
  /** Vignette : une seule page, sans repère de saut ni interaction. */
  miniature?: boolean
  /** Repères « Page 2 »… dans l'aperçu ; à désactiver pour le PDF. Par défaut : actifs hors miniature. */
  afficherSauts?: boolean
  /**
   * Fourni, chaque zone devient un bouton qui appelle ce rappel (aller à l'étape correspondante).
   * Absent, le document est statique (cas du PDF).
   */
  onCibler?: (zone: ZoneDocument) => void
}

/** Page A4 d'un devis, d'une facture ou d'un avoir. Rendu pur : tout vient des props. */
export function ApercuDocument({ document, charte, echelle = 1, miniature = false, afficherSauts = !miniature, onCibler }: Props) {
  const { ref, pages } = usePagesA4(!miniature)
  const nbPages = miniature ? 1 : pages
  const variables = { ...variablesCharte(charte), '--doc-echelle': echelle, '--doc-pages': nbPages } as CSSProperties

  return (
    <ContexteCible.Provider value={miniature ? undefined : onCibler}>
      <div className="doc" style={variables}>
        <div ref={ref} className="doc-page" data-modele={charte.modele} data-logo={charte.alignementLogo} data-miniature={miniature || undefined}>
          <MiseEnPage document={document} charte={charte} />
        </div>
        {afficherSauts && Array.from({ length: nbPages - 1 }, (_, i) => (
          <div key={i} className="doc-saut" style={{ '--doc-saut': i + 1 } as CSSProperties} aria-hidden><span>Page {i + 2}</span></div>
        ))}
      </div>
    </ContexteCible.Provider>
  )
}
