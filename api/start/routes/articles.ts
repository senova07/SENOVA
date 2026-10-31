import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ArticlesController = () => import('#controllers/articles_controller')
const CategoriesArticlesController = () => import('#controllers/categories_articles_controller')

const voir = middleware.permission({ toutes: ['articles.voir'] })
const gerer = middleware.permission({ toutes: ['articles.gerer'] })

/** À appeler dans le groupe `/api` authentifié + `organisation` (start/routes.ts). */
export default function routesArticles() {
  router.get('articles', [ArticlesController, 'index']).use(voir)
  router.get('articles/unites', [ArticlesController, 'unites']).use(voir)
  router.put('articles/ordre', [ArticlesController, 'ordonner']).use(gerer)
  router.post('articles', [ArticlesController, 'store']).use(gerer)
  router.get('articles/:id', [ArticlesController, 'show']).use(voir)
  router.put('articles/:id', [ArticlesController, 'update']).use(gerer)
  router.delete('articles/:id', [ArticlesController, 'destroy']).use(gerer)
  router.post('articles/:id/favori', [ArticlesController, 'favori']).use(gerer)
  router.post('articles/:id/dupliquer', [ArticlesController, 'dupliquer']).use(gerer)

  router.get('categories-articles', [CategoriesArticlesController, 'index']).use(voir)
  router.post('categories-articles', [CategoriesArticlesController, 'store']).use(gerer)
  router.put('categories-articles/:id', [CategoriesArticlesController, 'update']).use(gerer)
  router.delete('categories-articles/:id', [CategoriesArticlesController, 'destroy']).use(gerer)
}
