import type { RefObject } from 'react'
import { Icone } from '@/ui/Icone'

interface Props {
  valeur: string
  onChange(valeur: string): void
  inputRef: RefObject<HTMLInputElement | null>
}

export function RechercheArticles({ valeur, onChange, inputRef }: Props) {
  return (
    <div className="searchbar" role="search">
      <Icone nom="recherche" taille={16} poids="bold" className="searchbar__icon" />
      <input
        ref={inputRef}
        type="search"
        className="input searchbar__input"
        placeholder="Rechercher un article…"
        aria-label="Rechercher un article"
        autoComplete="off"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && valeur) {
            e.preventDefault()
            onChange('')
          }
        }}
      />
    </div>
  )
}
