import { useId, useState, type KeyboardEvent } from 'react'
import { Icone } from '@/ui/Icone'
import { avecTag } from './saisieClient'

interface Props {
  tags: string[]
  erreur?: string
  onChange(tags: string[]): void
}

/** Saisie de tags : Entrée ou virgule valide, Retour arrière retire le dernier. */
export function TagsClient({ tags, erreur, onChange }: Props) {
  const id = useId()
  const [saisie, setSaisie] = useState('')

  const ajouter = () => {
    onChange(avecTag(tags, saisie))
    setSaisie('')
  }
  const surTouche = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault()
      ajouter()
    } else if (ev.key === 'Backspace' && !saisie && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className={erreur ? 'field field--error' : 'field'}>
      <label className="field__label" htmlFor={id}>
        Tags
      </label>
      <div className="client-tags-saisie">
        {tags.map((t) => (
          <span className="client-tag" key={t}>
            {t}
            <button
              type="button"
              className="client-tag__retirer"
              aria-label={`Retirer le tag ${t}`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
            >
              <Icone nom="fermer" taille={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="client-tags-saisie__champ"
          value={saisie}
          aria-describedby={`${id}-aide`}
          onChange={(ev) => setSaisie(ev.target.value)}
          onKeyDown={surTouche}
          onBlur={ajouter}
          placeholder={tags.length ? '' : 'Ex. fidèle, syndic…'}
          maxLength={40}
        />
      </div>
      <p className={erreur ? 'field__error' : 'field__hint'} id={`${id}-aide`}>
        {erreur ?? 'Entrée ou virgule pour valider un tag.'}
      </p>
    </div>
  )
}
