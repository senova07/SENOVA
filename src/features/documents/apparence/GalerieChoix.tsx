import { useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface OptionGalerie<T extends string> {
  id: T
  libelle: string
  description?: string
  recommande?: boolean
  /** Miniature affichée au-dessus du libellé. */
  vignette: ReactNode
}

interface Props<T extends string> {
  /** Nom accessible du groupe. */
  libelle: string
  options: readonly OptionGalerie<T>[]
  valeur: T
  onChoisir(id: T): void
  /** Classe de grille : `galerie--modeles`, `galerie--tableaux`, `galerie--polices`. */
  variante: string
}

const DELTAS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/** Groupe radio de tuiles : une seule tabulation, les flèches changent le choix. Les conseillés passent en premier. */
export function GalerieChoix<T extends string>({ libelle, options, valeur, onChoisir, variante }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const ordonnees = [...options].sort((a, b) => Number(Boolean(b.recommande)) - Number(Boolean(a.recommande)))

  const clavier = (e: KeyboardEvent, rang: number) => {
    const delta = DELTAS[e.key]
    if (!delta) return
    e.preventDefault()
    const suivant = (rang + delta + ordonnees.length) % ordonnees.length
    onChoisir(ordonnees[suivant]!.id)
    refs.current[suivant]?.focus()
  }

  return (
    <div className={`galerie ${variante}`} role="radiogroup" aria-label={libelle}>
      {ordonnees.map((o, rang) => (
        <button
          key={o.id}
          ref={(el) => {
            refs.current[rang] = el
          }}
          type="button"
          role="radio"
          className="galerie__tuile"
          aria-checked={o.id === valeur}
          tabIndex={o.id === valeur ? 0 : -1}
          onClick={() => onChoisir(o.id)}
          onKeyDown={(e) => clavier(e, rang)}
        >
          {o.recommande ? <span className="galerie__conseil">Conseillé</span> : null}
          <span className="galerie__vignette" aria-hidden="true">{o.vignette}</span>
          <span className="galerie__libelle">{o.libelle}</span>
          {o.description ? <span className="galerie__description">{o.description}</span> : null}
        </button>
      ))}
    </div>
  )
}
