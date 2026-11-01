import type { RefObject } from 'react'
import { Icone } from '@/ui/Icone'
import './ChampRecherche.css'

interface ChampRechercheProps {
  valeur: string
  onChange(valeur: string): void
  /** Nom accessible du champ. */
  libelle: string
  placeholder: string
  inputRef?: RefObject<HTMLInputElement | null>
}

/** Recherche pleine largeur des listes ; Échap vide le champ. */
export function ChampRecherche({ valeur, onChange, libelle, placeholder, inputRef }: ChampRechercheProps) {
  return (
    <div className="zone-recherche" role="search">
      <Icone nom="recherche" taille={16} poids="bold" className="zone-recherche__icone" />
      <input
        ref={inputRef}
        type="search"
        className="input zone-recherche__saisie"
        placeholder={placeholder}
        aria-label={libelle}
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
