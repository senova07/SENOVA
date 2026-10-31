/**
 * Contrat des articles (mémoire commerciale) partagé par l'API et l'interface.
 * Contrat pur : aucune dépendance Adonis. Montants en nombres, identifiants en chaînes.
 */

export const TYPES_ARTICLE = [
  'service',
  'produit',
  'main_oeuvre',
  'deplacement',
  'abonnement',
  'forfait',
  'autre',
] as const

export type TypeArticle = (typeof TYPES_ARTICLE)[number]

export const LIBELLES_TYPE_ARTICLE: Record<TypeArticle, string> = {
  service: 'Service',
  produit: 'Produit',
  main_oeuvre: "Main-d'œuvre",
  deplacement: 'Déplacement',
  abonnement: 'Abonnement',
  forfait: 'Pack / forfait',
  autre: 'Autre',
}

/** Unités proposées ; le champ reste libre (unités personnalisables). */
export const UNITES_PAR_DEFAUT = ['u', 'h', 'j', 'forfait', 'm²', 'ml', 'm³', 'kg', 'mois', 'km']

export const TAUX_TVA = [0, 2.1, 5.5, 8.5, 10, 20] as const
export const TAUX_TVA_DEFAUT = 20

export interface CategorieArticle {
  id: string
  nom: string
  ordre: number
}

export interface Article {
  id: string
  reference: string | null
  nom: string
  description: string
  type: TypeArticle
  unite: string
  prixUnitaireHt: number
  tauxTva: number
  prixAchatHt: number | null
  categorieId: string | null
  favori: boolean
  actif: boolean
  ordre: number
}

/** Ce que l'interface envoie pour créer ou modifier un article (categorieId numérique ou chaîne numérique). */
export interface ArticleSaisie {
  reference?: string | null
  nom: string
  description?: string
  type: TypeArticle
  unite: string
  prixUnitaireHt: number
  tauxTva: number
  prixAchatHt?: number | null
  categorieId?: string | number | null
  favori?: boolean
  actif?: boolean
}

const arrondi = (n: number) => Math.round(n * 100) / 100

/** Marge sur prix d'achat : montant (HT) et taux de marge en % du coût. Null sans prix d'achat. */
export function margeArticle(
  article: Pick<Article, 'prixUnitaireHt' | 'prixAchatHt'>
): { montant: number; taux: number } | null {
  if (article.prixAchatHt === null || article.prixAchatHt === undefined) return null
  const montant = arrondi(article.prixUnitaireHt - article.prixAchatHt)
  const taux = article.prixAchatHt === 0 ? 0 : arrondi((montant / article.prixAchatHt) * 100)
  return { montant, taux }
}

/** Ligne de document : COPIE figée de l'article. Modifier le catalogue ne change jamais un ancien document. */
export interface LigneDepuisArticle {
  articleId: string
  nom: string
  description: string
  unite: string
  prixUnitaireHt: number
  tauxTva: number
  type: TypeArticle
  quantite: number
}

export function ligneDepuisArticle(
  article: Pick<
    Article,
    'id' | 'nom' | 'description' | 'unite' | 'prixUnitaireHt' | 'tauxTva' | 'type'
  >
): LigneDepuisArticle {
  return {
    articleId: article.id,
    nom: article.nom,
    description: article.description,
    unite: article.unite,
    prixUnitaireHt: article.prixUnitaireHt,
    tauxTva: article.tauxTva,
    type: article.type,
    quantite: 1,
  }
}
