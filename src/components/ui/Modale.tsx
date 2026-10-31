import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icone } from '@/components/ui/Icone'

interface ModaleProps {
  ouvert: boolean
  onFermer(): void
  titre: string
  soustitre?: string
  pied?: ReactNode
  children: ReactNode
}

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Modale accessible : Échap ferme, Tab reste piégé dedans, le focus revient au déclencheur. */
export function Modale({ ouvert, onFermer, titre, soustitre, pied, children }: ModaleProps) {
  const panneau = useRef<HTMLDivElement>(null)
  // Lu par référence : onFermer change souvent, le piège à focus ne doit pas se reposer.
  const fermer = useRef(onFermer)
  useEffect(() => {
    fermer.current = onFermer
  }, [onFermer])

  useEffect(() => {
    if (!ouvert) return undefined
    const declencheur = document.activeElement as HTMLElement | null

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return fermer.current()
      if (e.key !== 'Tab' || !panneau.current) return
      const liste = [...panneau.current.querySelectorAll<HTMLElement>(FOCUSABLES)]
      const premier = liste[0]
      const dernier = liste[liste.length - 1]
      if (!premier || !dernier) return
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault()
        dernier.focus()
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault()
        premier.focus()
      }
    }

    const debordement = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', surTouche)
    panneau.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()

    return () => {
      document.body.style.overflow = debordement
      document.removeEventListener('keydown', surTouche)
      declencheur?.focus?.()
    }
  }, [ouvert])

  if (!ouvert) return null

  return createPortal(
    <div
      className="calque"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFermer()
      }}
    >
      <div className="modale" role="dialog" aria-modal="true" aria-label={titre} ref={panneau}>
        <div className="modale__entete">
          <div>
            <h2 className="modale__titre">{titre}</h2>
            {soustitre ? <p className="modale__soustitre">{soustitre}</p> : null}
          </div>
          <button type="button" className="modale__fermer" onClick={onFermer} aria-label="Fermer">
            <Icone nom="fermer" taille={18} />
          </button>
        </div>
        <div className="modale__corps">{children}</div>
        {pied ? <div className="modale__pied">{pied}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
