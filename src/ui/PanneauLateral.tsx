import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BoutonIcone } from '@/ui/Bouton'
import { useCalque } from '@/ui/useCalque'
import './PanneauLateral.css'

interface PanneauLateralProps {
  ouvert: boolean
  onFermer(): void
  titre: string
  soustitre?: ReactNode
  pied?: ReactNode
  children: ReactNode
}

/** Tiroir à droite (maquette ArticleDrawer) : même accessibilité que Dialogue. */
export function PanneauLateral({ ouvert, onFermer, titre, soustitre, pied, children }: PanneauLateralProps) {
  const idTitre = useId()
  const panneau = useRef<HTMLElement>(null)
  const corps = useRef<HTMLDivElement>(null)
  useCalque(ouvert, onFermer, panneau, corps)

  if (!ouvert) return null

  return createPortal(
    <div className="panneau-racine">
      <div className="panneau-voile" onMouseDown={onFermer} aria-hidden="true" />
      <aside className="panneau" role="dialog" aria-modal="true" aria-labelledby={idTitre} tabIndex={-1} ref={panneau}>
        <header className="panneau__entete">
          <div>
            <h2 id={idTitre} className="panneau__titre">
              {titre}
            </h2>
            {soustitre ? <p className="panneau__soustitre">{soustitre}</p> : null}
          </div>
          <BoutonIcone icone="fermer" libelle="Fermer le panneau" onClick={onFermer} />
          <span className="panneau__facette" aria-hidden="true" />
        </header>
        <div className="panneau__corps" ref={corps}>
          {children}
        </div>
        {pied ? <footer className="panneau__pied">{pied}</footer> : null}
      </aside>
    </div>,
    document.body,
  )
}
