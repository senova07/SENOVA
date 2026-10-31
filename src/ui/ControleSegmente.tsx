import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import './ControleSegmente.css'

interface ControleSegmenteProps<T extends string> {
  options: readonly { id: T; libelle: ReactNode }[]
  valeur: T
  onChoisir(id: T): void
  /** Nom accessible du groupe. */
  libelle: string
}

const DELTAS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/** Choix unique entre quelques options : radiogroup, une seule tabulation, flèches pour changer. */
export function ControleSegmente<T extends string>({ options, valeur, onChoisir, libelle }: ControleSegmenteProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const clavier = (ev: KeyboardEvent, rang: number) => {
    const delta = DELTAS[ev.key]
    if (!delta) return
    ev.preventDefault()
    const suivant = (rang + delta + options.length) % options.length
    onChoisir(options[suivant]!.id)
    refs.current[suivant]?.focus()
  }

  const trouve = options.some((o) => o.id === valeur)
  return (
    <div className="seg" role="radiogroup" aria-label={libelle}>
      {options.map((option, rang) => (
        <button
          key={option.id}
          ref={(el) => {
            refs.current[rang] = el
          }}
          type="button"
          role="radio"
          className="seg__opt"
          aria-checked={option.id === valeur}
          tabIndex={(trouve ? option.id === valeur : rang === 0) ? 0 : -1}
          onClick={() => onChoisir(option.id)}
          onKeyDown={(ev) => clavier(ev, rang)}
        >
          {option.libelle}
        </button>
      ))}
    </div>
  )
}
