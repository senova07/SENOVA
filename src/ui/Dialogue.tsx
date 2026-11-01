import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BoutonIcone } from '@/ui/Bouton'
import { useCalque } from '@/ui/useCalque'
import './Dialogue.css'

interface DialogueProps {
  ouvert: boolean
  onFermer(): void
  titre: string
  soustitre?: string
  pied?: ReactNode
  children: ReactNode
}

/** Dialogue modal : Échap ferme, Tab reste piégé dedans, le focus revient au déclencheur. */
export function Dialogue({ ouvert, onFermer, titre, soustitre, pied, children }: DialogueProps) {
  const panneau = useRef<HTMLDivElement>(null)
  const corps = useRef<HTMLDivElement>(null)
  useCalque(ouvert, onFermer, panneau, corps)

  if (!ouvert) return null

  return createPortal(
    <div
      className="dialogue-calque"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onFermer()
      }}
    >
      <div className="dialogue" role="dialog" aria-modal="true" aria-label={titre} tabIndex={-1} ref={panneau}>
        <div className="dialogue__entete">
          <div>
            <h2 className="dialogue__titre">{titre}</h2>
            {soustitre ? <p className="dialogue__soustitre">{soustitre}</p> : null}
          </div>
          <BoutonIcone icone="fermer" libelle="Fermer" onClick={onFermer} />
        </div>
        <div className="dialogue__corps" ref={corps}>
          {children}
        </div>
        {pied ? <div className="dialogue__pied">{pied}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
