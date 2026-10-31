import { Compteurs } from '@/ui/Compteurs'
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
    <Compteurs
      libelle="Compteurs du catalogue"
      compteurs={[
        { libelle: 'articles', valeur: compteurs.total },
        { libelle: 'favoris', valeur: compteurs.favoris },
      ]}
      actions={<FiltresArticles valeur={filtres} categories={categories} onChange={onFiltres} />}
    />
  )
}
