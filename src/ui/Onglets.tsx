import { useRef, type KeyboardEvent } from 'react'
import './Onglets.css'

interface OngletsProps<T extends string> {
  onglets: readonly { id: T; libelle: string; compte?: number }[]
  actif: T
  onChoisir(id: T): void
  libelle: string
  /** Préfixe des ids : onglets `${prefixe}-onglet-${id}`, panneau `${prefixe}-panneau` (à poser sur le contenu, role="tabpanel"). */
  prefixe: string
}

const idPanneau = (prefixe: string) => `${prefixe}-panneau`
const idOnglet = (prefixe: string, id: string) => `${prefixe}-onglet-${id}`

/** Onglets soulignés (pas de pilules), flèches gauche / droite. */
export function Onglets<T extends string>({ onglets, actif, onChoisir, libelle, prefixe }: OngletsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const clavier = (ev: KeyboardEvent, rang: number) => {
    const delta = ev.code === 'ArrowRight' ? 1 : ev.code === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    ev.preventDefault()
    const suivant = (rang + delta + onglets.length) % onglets.length
    onChoisir(onglets[suivant]!.id)
    refs.current[suivant]?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={libelle}>
      {onglets.map((onglet, rang) => (
        <button
          key={onglet.id}
          ref={(el) => {
            refs.current[rang] = el
          }}
          type="button"
          role="tab"
          id={idOnglet(prefixe, onglet.id)}
          className="tabs__tab"
          aria-selected={onglet.id === actif}
          aria-controls={idPanneau(prefixe)}
          tabIndex={onglet.id === actif ? 0 : -1}
          onClick={() => onChoisir(onglet.id)}
          onKeyDown={(ev) => clavier(ev, rang)}
        >
          {onglet.libelle}
          {onglet.compte != null ? <span className="tabs__count num">{onglet.compte}</span> : null}
        </button>
      ))}
    </div>
  )
}
