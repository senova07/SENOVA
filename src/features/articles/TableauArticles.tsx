import { Icone } from '@/ui/Icone'
import type { Article, CategorieArticle } from '@shared/articles'
import type { CleTri, Tri } from './filtres'
import { LigneArticle } from './LigneArticle'
import type { ActionLigne } from './MenuLigneArticle'

interface Props {
  articles: Article[]
  categories: readonly CategorieArticle[]
  tri: Tri | null
  peutGerer: boolean
  onTrier(cle: CleTri): void
  onOuvrir(article: Article): void
  onAction(article: Article, action: ActionLigne): void
}

const COLONNES: { cle: CleTri | null; libelle: string; classe: string }[] = [
  { cle: 'nom', libelle: 'Article', classe: 'col-name' },
  { cle: 'type', libelle: 'Type', classe: 'col-type' },
  { cle: 'reference', libelle: 'Référence', classe: 'col-ref' },
  { cle: null, libelle: 'Unité', classe: 'col-unit' },
  { cle: 'prix', libelle: 'Prix HT', classe: 'col-price' },
  { cle: 'tva', libelle: 'TVA', classe: 'col-vat' },
]

export function TableauArticles({ articles, categories, tri, peutGerer, onTrier, onOuvrir, onAction }: Props) {
  return (
    <div className="a-table-wrap">
      <table className="a-table">
        <thead>
          <tr>
            <th scope="col" className="col-fav">
              <Icone nom="etoile" taille={17} className="th-star" />
              <span className="sr-only">Favori</span>
            </th>
            {COLONNES.map((c) => {
              const cle = c.cle
              const actif = cle !== null && tri?.cle === cle
              return (
                <th
                  key={c.libelle}
                  scope="col"
                  className={c.classe}
                  aria-sort={actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {cle ? (
                    <button type="button" className="th-sort" data-sorted={actif || undefined} onClick={() => onTrier(cle)}>
                      {c.libelle}
                      {actif ? (
                        <Icone nom={tri.sens === 'asc' ? 'haut' : 'bas'} taille={12} poids="bold" />
                      ) : cle === 'nom' ? (
                        <Icone nom="trier" taille={12} poids="bold" />
                      ) : null}
                    </button>
                  ) : (
                    c.libelle
                  )}
                </th>
              )
            })}
            <th scope="col" className="col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a, rang) => (
            <LigneArticle
              key={a.id}
              article={a}
              categorie={categories.find((c) => c.id === a.categorieId)?.nom}
              peutGerer={peutGerer}
              versLeHaut={articles.length > 3 && rang >= articles.length - 2}
              onOuvrir={() => onOuvrir(a)}
              onAction={(action) => onAction(a, action)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
