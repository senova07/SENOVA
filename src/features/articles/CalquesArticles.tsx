import { Bouton } from '@/ui/Bouton'
import { Dialogue } from '@/ui/Dialogue'
import type { Article } from '@shared/articles'
import { ModaleCategories } from './ModaleCategories'
import { ModaleOrdre } from './ModaleOrdre'
import { PanneauArticle } from './PanneauArticle'
import type { useCatalogue } from './useCatalogue'

/** `article: null` = création. */
export type Calque =
  | { genre: 'article'; article: Article | null }
  | { genre: 'suppression'; article: Article }
  | { genre: 'ordre' }
  | { genre: 'categories' }

interface Props {
  calque: Calque | null
  cat: ReturnType<typeof useCatalogue>
  suppressionEnCours: boolean
  onSupprimer(article: Article): void
  onFermer(): void
}

/** Panneau, modales et confirmation de suppression, selon le calque ouvert. */
export function CalquesArticles({ calque, cat, suppressionEnCours, onSupprimer, onFermer }: Props) {
  const apresEcriture = () => {
    onFermer()
    void cat.recharger()
  }
  return (
    <>
      {calque?.genre === 'article' ? (
        <PanneauArticle
          key={calque.article?.id ?? 'nouveau'}
          article={calque.article}
          categories={cat.categories}
          unites={cat.unites}
          onCategorieCreee={cat.ajouterCategorie}
          onEnregistre={apresEcriture}
          onFermer={onFermer}
        />
      ) : null}
      {calque?.genre === 'ordre' ? (
        <ModaleOrdre articles={cat.articles} onEnregistre={apresEcriture} onFermer={onFermer} />
      ) : null}
      {calque?.genre === 'categories' && cat.etat === 'pret' ? (
        <ModaleCategories
          categories={cat.categories}
          articles={cat.articles}
          onChange={() => void cat.recharger()}
          onFermer={onFermer}
        />
      ) : null}
      <Dialogue
        ouvert={calque?.genre === 'suppression'}
        onFermer={onFermer}
        titre="Supprimer cet article ?"
        soustitre={calque?.genre === 'suppression' ? calque.article.nom : ''}
        pied={
          <>
            <Bouton onClick={onFermer}>Conserver</Bouton>
            <Bouton
              variante="danger"
              icone="poubelle"
              disabled={suppressionEnCours}
              onClick={() => calque?.genre === 'suppression' && onSupprimer(calque.article)}
            >
              Supprimer
            </Bouton>
          </>
        }
      >
        <p>L’article disparaît du catalogue. Pour le garder sans le proposer, archivez-le plutôt.</p>
      </Dialogue>
    </>
  )
}
