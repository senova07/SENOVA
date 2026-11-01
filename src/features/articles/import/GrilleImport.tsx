import { useEffect, useRef, type CSSProperties } from 'react'
import type { CategorieArticle } from '@shared/articles'
import { Icone } from '@/ui/Icone'
import { LigneGrille } from './LigneGrille'
import { estVide, type CleChamp, type ColonneDef, type ErreursLigne, type LigneImport, type Tri } from './modele'
import { useNavigationGrille } from './useNavigationGrille'

interface Props {
  lignes: readonly LigneImport[]
  colonnes: readonly ColonneDef[]
  erreurs: ReadonlyMap<string, ErreursLigne>
  selection: ReadonlySet<string>
  tri: Tri | null
  categories: readonly CategorieArticle[]
  onChange(id: string, cle: CleChamp, valeur: string | boolean): void
  onSelection(ids: Set<string>): void
  onTri(cle: CleChamp): void
  ajouterLigne(): void
  coller(ligne: number, colonne: number, texte: string): void
}

/** Grille éditable (`role="grid"`) : une ligne d'en-têtes, une case de sélection par ligne, un champ par cellule. */
export function GrilleImport({ lignes, colonnes, erreurs, selection, tri, categories, onChange, onSelection, onTri, ajouterLigne, coller }: Props) {
  const nbColonnes = colonnes.length
  const { table, surClavier, surCollage } = useNavigationGrille({ nbLignes: lignes.length, nbColonnes, ajouterLigne, ligneRemplie: (rang) => { const l = lignes[rang]; return !!l && !estVide(l) }, coller })
  const dernier = useRef<number | null>(null)

  const tous = lignes.length > 0 && lignes.every((l) => selection.has(l.id))
  const partiel = !tous && lignes.some((l) => selection.has(l.id))
  const caseTete = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (caseTete.current) caseTete.current.indeterminate = partiel
  }, [partiel])

  const choisir = (rang: number, maj: boolean) => {
    const suite = new Set(selection)
    const cible = lignes[rang]
    if (!cible) return
    const allumer = !suite.has(cible.id)
    const [a, b] = maj && dernier.current !== null ? [dernier.current, rang].sort((x, y) => x - y) : [rang, rang]
    for (let i = a!; i <= b!; i++) {
      const id = lignes[i]!.id
      if (allumer) suite.add(id)
      else suite.delete(id)
    }
    dernier.current = rang
    onSelection(suite)
  }

  return (
    <table ref={table} className="grille" role="grid" aria-label="Articles à ajouter" aria-rowcount={lignes.length + 1} aria-colcount={colonnes.length + 2}>
      <thead>
        <tr role="row" aria-rowindex={1}>
          <th role="columnheader" aria-colindex={1} className="grille__num"><span className="sr-only">Ligne</span></th>
          <th role="columnheader" aria-colindex={2} className="grille__case">
            <input
              ref={caseTete}
              type="checkbox"
              className="grille__boite"
              checked={tous}
              aria-label="Tout sélectionner"
              onChange={() => onSelection(tous ? new Set() : new Set(lignes.map((l) => l.id)))}
            />
          </th>
          {colonnes.map((c, i) => {
            const actif = tri?.cle === c.cle
            return (
              <th
                key={c.cle}
                role="columnheader"
                aria-colindex={i + 3}
                style={{ '--largeur': `${c.largeur}px` } as CSSProperties}
                className={`grille__th grille__th--${c.genre}`}
                aria-sort={actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {c.triable ? (
                  <button type="button" className="grille__tri" data-actif={actif || undefined} onClick={() => onTri(c.cle)}>
                    {c.libelle}
                    {c.obligatoire ? <span className="grille__requis" aria-hidden="true"> *</span> : null}
                    <Icone nom={actif ? (tri.sens === 'asc' ? 'haut' : 'bas') : 'trier'} taille={13} />
                  </button>
                ) : (
                  c.libelle
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody onKeyDown={surClavier} onPaste={surCollage}>
        {lignes.map((l, rang) => (
          <LigneGrille
            key={l.id}
            ligne={l}
            rang={rang}
            colonnes={colonnes}
            erreurs={erreurs.get(l.id)}
            choisie={selection.has(l.id)}
            categories={categories}
            onChange={onChange}
            onChoisir={choisir}
          />
        ))}
      </tbody>
    </table>
  )
}
