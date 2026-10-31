import type { CategorieArticle } from '@shared/articles'
import { FiltresArticles } from './FiltresArticles'
import type { FiltresAvances } from './filtres'

interface Props {
  filtres: FiltresAvances
  categories: readonly CategorieArticle[]
  onFiltres(filtres: FiltresAvances): void
  compteurs: { total: number; favoris: number }
}

/** Ligne des compteurs (articles, favoris) avec le bouton Filtres à droite. */
export function BarreOutilsArticles({ filtres, categories, onFiltres, compteurs }: Props) {
  return (
    <div className="toolbar">
      <dl className="stats">
        <div className="stats__item">
          <dt className="sr-only">Articles</dt>
          <dd>
            <strong className="num">{compteurs.total}</strong> articles
          </dd>
        </div>
        <div className="stats__item">
          <dt className="sr-only">Favoris</dt>
          <dd>
            <strong className="num">{compteurs.favoris}</strong> favoris
          </dd>
        </div>
      </dl>
      <FiltresArticles valeur={filtres} categories={categories} onChange={onFiltres} />
    </div>
  )
}
