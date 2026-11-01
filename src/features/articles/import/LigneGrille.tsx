import type { CategorieArticle } from '@shared/articles'
import { CelluleGrille } from './CelluleGrille'
import type { ColonneDef, ErreursLigne, LigneImport } from './modele'

interface Props {
  ligne: LigneImport
  rang: number
  colonnes: readonly ColonneDef[]
  erreurs?: ErreursLigne
  choisie: boolean
  categories: readonly CategorieArticle[]
  onChange(id: string, cle: ColonneDef['cle'], valeur: string | boolean): void
  onChoisir(rang: number, maj: boolean): void
}

export function LigneGrille({ ligne, rang, colonnes, erreurs, choisie, categories, onChange, onChoisir }: Props) {
  let nav = -1
  return (
    <tr role="row" aria-rowindex={rang + 2} aria-selected={choisie} className="grille__ligne" data-invalide={erreurs ? '' : undefined}>
      <td role="gridcell" aria-colindex={1} className="grille__num">{rang + 1}</td>
      <td role="gridcell" aria-colindex={2} className="grille__case">
        <input
          type="checkbox"
          className="grille__boite"
          checked={choisie}
          aria-label={`Sélectionner la ligne ${rang + 1}`}
          onChange={() => undefined}
          onClick={(e) => onChoisir(rang, e.shiftKey)}
        />
      </td>
      {colonnes.map((colonne, i) => {
        nav++
        const erreur = erreurs?.[colonne.cle] ?? (colonne.cle === 'nom' ? ligne.echec : undefined)
        return (
          <CelluleGrille
            key={colonne.cle}
            ligne={ligne}
            colonne={colonne}
            rang={rang}
            colNav={nav}
            indexColonne={i + 3}
            erreur={erreur}
            categories={categories}
            onChange={onChange}
          />
        )
      })}
    </tr>
  )
}
