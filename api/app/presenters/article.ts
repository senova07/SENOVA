import type Article from '#models/article'
import type CategorieArticle from '#models/categorie_article'
import type { Article as ArticleDto, CategorieArticle as CategorieDto } from '#shared/articles'

/** Lucid rend les decimal en chaînes (MariaDB) : conversion explicite en nombre. */
export function presenterArticle(article: Article): ArticleDto {
  return {
    id: String(article.id),
    reference: article.reference,
    nom: article.nom,
    description: article.description ?? '',
    type: article.type,
    unite: article.unite,
    prixUnitaireHt: Number(article.prixUnitaireHt),
    tauxTva: Number(article.tauxTva),
    prixAchatHt: article.prixAchatHt === null ? null : Number(article.prixAchatHt),
    categorieId: article.categorieId === null ? null : String(article.categorieId),
    favori: article.favori,
    actif: article.actif,
    ordre: article.ordre,
  }
}

export function presenterCategorie(categorie: CategorieArticle): CategorieDto {
  return { id: String(categorie.id), nom: categorie.nom, ordre: categorie.ordre }
}
