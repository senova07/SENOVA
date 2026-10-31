import { useCallback, useEffect, useState } from 'react'
import { apiArticles, apiCategories } from '@/services/articlesApi'
import { UNITES_PAR_DEFAUT, type Article, type CategorieArticle } from '@shared/articles'

export type EtatCatalogue = 'chargement' | 'pret' | 'erreur'

/** Charge articles, catégories et unités ; `recharger` relit tout après une écriture. */
export function useCatalogue() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<CategorieArticle[]>([])
  const [unites, setUnites] = useState<string[]>(UNITES_PAR_DEFAUT)
  const [etat, setEtat] = useState<EtatCatalogue>('chargement')
  const [erreur, setErreur] = useState('')

  const recharger = useCallback(async () => {
    try {
      const [a, c, u] = await Promise.all([
        apiArticles.lister(),
        apiCategories.lister(),
        apiArticles.unites().catch(() => UNITES_PAR_DEFAUT),
      ])
      setArticles(a)
      setCategories(c)
      setUnites(u)
      setEtat('pret')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Chargement impossible.')
      setEtat('erreur')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
    void recharger()
  }, [recharger])

  const ajouterCategorie = (categorie: CategorieArticle) =>
    setCategories((liste) => [...liste, categorie])

  return { articles, categories, unites, etat, erreur, recharger, ajouterCategorie }
}
