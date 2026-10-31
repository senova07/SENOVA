import { useId, useState, type KeyboardEvent } from 'react'
import { useCatalogue } from '@/features/articles/useCatalogue'
import { formaterEuro } from '@/lib/format'
import { sansAccent } from './donnees'
import type { Article } from '@shared/articles'

interface RechercheLigneProps {
  onArticle(article: Article): void
  onLibre(designation: string): void
}

const MAX_PROPOSITIONS = 8

/** Champ unique d'ajout : articles du catalogue, ou en dernier choix une ligne libre. */
export function RechercheLigne({ onArticle, onLibre }: RechercheLigneProps) {
  const id = useId()
  const { articles, etat } = useCatalogue()
  const [requete, setRequete] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const [actif, setActif] = useState(0)

  const q = sansAccent(requete.trim())
  const trouves = articles
    .filter(
      (a) =>
        a.actif && (!q || sansAccent(`${a.nom} ${a.reference ?? ''} ${a.description}`).includes(q)),
    )
    .slice(0, MAX_PROPOSITIONS)
  const total = trouves.length + 1 // + la ligne libre, toujours proposée en dernier
  const rangActif = Math.min(actif, total - 1)

  const choisir = (rang: number) => {
    const article = trouves[rang]
    if (article) onArticle(article)
    else onLibre(requete.trim())
    setRequete('')
    setActif(0)
    setOuvert(false)
  }

  const clavier = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault()
      setOuvert(true)
      setActif((rangActif + (ev.key === 'ArrowDown' ? 1 : total - 1)) % total)
    } else if (ev.key === 'Enter') {
      ev.preventDefault()
      if (!ouvert) {
        setOuvert(true)
        return
      }
      choisir(rangActif)
    } else if (ev.key === 'Escape' && ouvert) {
      ev.stopPropagation()
      setOuvert(false)
    }
  }

  return (
    <div className="lignes-recherche">
      <input
        type="text"
        role="combobox"
        className="champ__saisie lignes-recherche__champ"
        placeholder="Ajouter un article ou une ligne libre…"
        aria-label="Ajouter un article ou une ligne libre"
        aria-autocomplete="list"
        aria-expanded={ouvert}
        aria-controls={`${id}-liste`}
        aria-activedescendant={ouvert ? `${id}-${rangActif}` : undefined}
        autoComplete="off"
        value={requete}
        onChange={(ev) => {
          setRequete(ev.target.value)
          setActif(0)
          setOuvert(true)
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={clavier}
      />
      {ouvert ? (
        <ul className="lignes-recherche__liste" role="listbox" id={`${id}-liste`}>
          {trouves.map((a, rang) => (
            <li
              key={a.id}
              id={`${id}-${rang}`}
              role="option"
              aria-selected={rang === rangActif}
              className="lignes-recherche__option"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => choisir(rang)}
            >
              <span className="lignes-recherche__nom">
                {a.nom}
                {a.reference ? <small> {a.reference}</small> : null}
              </span>
              <span className="lignes-recherche__prix">
                {formaterEuro(a.prixUnitaireHt)} / {a.unite}
              </span>
            </li>
          ))}
          <li
            id={`${id}-${trouves.length}`}
            role="option"
            aria-selected={trouves.length === rangActif}
            className="lignes-recherche__option"
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => choisir(trouves.length)}
          >
            <span className="lignes-recherche__nom">
              {requete.trim() ? `Ligne libre : « ${requete.trim()} »` : 'Ligne libre vide'}
            </span>
          </li>
          {etat === 'erreur' ? (
            <li role="presentation" className="lignes-recherche__note">
              Catalogue indisponible : seule la ligne libre est proposée.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
