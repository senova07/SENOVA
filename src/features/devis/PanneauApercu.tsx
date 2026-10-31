import { useEffect, useState } from 'react'
import { ApercuDevis } from './ApercuDevis'
import type { Devis, ModeleDevis } from './donnees'
import { LARGEUR_A4 } from './styleFeuille'

/** 210 mm à 96 dpi. */
const MARGE = 32

interface PanneauApercuProps {
  devis: Devis
  modele: ModeleDevis
  /** Seule la feuille du panneau principal est imprimée (voir espace-devis.css). */
  imprimable?: boolean
}

function useTaille(element: HTMLElement | null) {
  const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 })
  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const lire = () => {
      // Panneau masqué (onglet inactif) : on garde la dernière mesure utile.
      if (element.clientWidth > 0)
        setTaille({ largeur: element.clientWidth, hauteur: element.offsetHeight })
    }
    lire()
    const obs = new ResizeObserver(lire)
    obs.observe(element)
    return () => obs.disconnect()
  }, [element])
  return taille
}

/** Fond gris, feuille A4 mise à l'échelle pour tenir dans la colonne, zoom ajuster / 100 %. */
export function PanneauApercu({ devis, modele, imprimable = false }: PanneauApercuProps) {
  const [ajuste, setAjuste] = useState(true)
  const [zone, setZone] = useState<HTMLDivElement | null>(null)
  const [feuille, setFeuille] = useState<HTMLDivElement | null>(null)
  const dimZone = useTaille(zone)
  const dimFeuille = useTaille(feuille)

  const echelle =
    ajuste && dimZone.largeur > 0
      ? Math.min(1.25, Math.max(0.3, (dimZone.largeur - MARGE) / LARGEUR_A4))
      : 1

  return (
    <div className="espace-apercu-panneau">
      <div className="espace-zoom" role="group" aria-label="Zoom de l’aperçu">
        <button type="button" aria-pressed={ajuste} onClick={() => setAjuste(true)}>
          Ajuster
        </button>
        <button type="button" aria-pressed={!ajuste} onClick={() => setAjuste(false)}>
          100 %
        </button>
      </div>
      <div
        className={ajuste ? 'espace-apercu-zone espace-apercu-zone--ajuste' : 'espace-apercu-zone'}
        ref={setZone}
      >
        <div
          className={imprimable ? 'espace-echelle espace-imprimable' : 'espace-echelle'}
          style={{
            width: LARGEUR_A4 * echelle,
            height: dimFeuille.hauteur ? dimFeuille.hauteur * echelle : undefined,
          }}
        >
          <div
            className="espace-feuille"
            ref={setFeuille}
            style={{ width: LARGEUR_A4, transform: `scale(${echelle})` }}
          >
            <ApercuDevis devis={devis} modele={modele} />
          </div>
        </div>
      </div>
    </div>
  )
}
