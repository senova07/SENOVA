import { api } from '@/services/http'
import type { Article, ArticleSaisie, CategorieArticle } from '@shared/articles'

/** Contrat `/api/articles` et `/api/categories-articles`. */
export const apiArticles = {
  /** Tout le catalogue, inactifs compris : le filtrage se fait à l'écran. */
  lister: () => api.lire<Article[]>('/articles', { inactifs: '1' }),
  unites: () => api.lire<string[]>('/articles/unites'),
  creer: (saisie: ArticleSaisie) => api.creer<Article>('/articles', saisie),
  modifier: (id: string, saisie: ArticleSaisie) => api.remplacer<Article>(`/articles/${id}`, saisie),
  supprimer: (id: string) => api.supprimer(`/articles/${id}`),
  favori: (id: string, favori: boolean) => api.creer<Article>(`/articles/${id}/favori`, { favori }),
  dupliquer: (id: string) => api.creer<Article>(`/articles/${id}/dupliquer`),
  ordonner: (ids: string[]) => api.remplacer<void>('/articles/ordre', { ids: ids.map(Number) }),
}

export const apiCategories = {
  lister: () => api.lire<CategorieArticle[]>('/categories-articles'),
  creer: (nom: string) => api.creer<CategorieArticle>('/categories-articles', { nom }),
  renommer: (id: string, nom: string) =>
    api.remplacer<CategorieArticle>(`/categories-articles/${id}`, { nom }),
  supprimer: (id: string) => api.supprimer(`/categories-articles/${id}`),
}
