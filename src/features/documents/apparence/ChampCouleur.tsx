import { useId, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { normaliserHex } from '../../../lib/couleur'

interface Props {
  libelle: string
  aide: string
  valeur: string
  /** La roue règle cette couleur. */
  actif: boolean
  /** Contraste insuffisant (voir `avertissementsContraste`). */
  alerte: boolean
  onSelect(): void
  onChange(hex: string): void
}

const SIX_CHIFFRES = /^#?[0-9a-f]{6}$/i

/**
 * Pastille + code hexadécimal. Pendant la frappe, seule une valeur complète (6 chiffres) est appliquée ;
 * l'écriture courte (#ABC) et l'erreur sont traitées à la sortie du champ ou à Entrée.
 */
export function ChampCouleur({ libelle, aide, valeur, actif, alerte, onSelect, onChange }: Props) {
  const id = useId()
  /** null : le champ n'est pas en cours de saisie, il montre la couleur courante. */
  const [saisie, setSaisie] = useState<string | null>(null)
  const [refuse, setRefuse] = useState<string | null>(null)

  const valider = (texte: string) => {
    const hex = normaliserHex(texte)
    if (hex) {
      setRefuse(null)
      onChange(hex)
    } else setRefuse(texte)
  }
  const auClavier = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || saisie === null) return
    e.preventDefault()
    valider(saisie)
  }

  return (
    <div className="champ-couleur" data-actif={actif || undefined} data-alerte={alerte || undefined}>
      <button
        type="button"
        className="champ-couleur__pastille"
        style={{ '--c': valeur } as CSSProperties}
        aria-pressed={actif}
        aria-label={`Régler la ${libelle.toLowerCase()} avec la roue`}
        onClick={onSelect}
      />
      <div className="champ-couleur__corps">
        <label className="champ-couleur__libelle" htmlFor={id}>{libelle}</label>
        <span className="champ-couleur__aide">{aide}</span>
        <input
          id={id}
          className="input champ-couleur__saisie"
          value={saisie ?? valeur}
          spellCheck={false}
          aria-invalid={refuse !== null || undefined}
          aria-describedby={refuse !== null ? `${id}-erreur` : undefined}
          onFocus={() => {
            setSaisie(valeur)
            setRefuse(null)
            onSelect()
          }}
          onKeyDown={auClavier}
          onBlur={() => {
            if (saisie !== null) valider(saisie)
            setSaisie(null)
          }}
          onChange={(e) => {
            setSaisie(e.target.value)
            setRefuse(null)
            if (SIX_CHIFFRES.test(e.target.value.trim())) onChange(normaliserHex(e.target.value)!)
          }}
        />
        {refuse !== null ? (
          <span className="champ-couleur__erreur" id={`${id}-erreur`} role="alert">
            « {refuse} » n’est pas un code valide, par exemple #0B2A50. La couleur précédente est conservée.
          </span>
        ) : null}
      </div>
    </div>
  )
}
