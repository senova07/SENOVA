import { sansAccent } from '@/lib/texte'
import { LIBELLES_TYPE_ARTICLE, type Article, type CategorieArticle, type TypeArticle } from '@shared/articles'

export type Onglet = 'tous' | 'favoris' | TypeArticle
export type StatutFiltre = 'actifs' | 'archives' | 'tous'
export type CleTri = 'nom' | 'type' | 'reference' | 'prix' | 'tva'

export interface Tri {
  cle: CleTri
  sens: 'asc' | 'desc'
}

export interface FiltresAvances {
  tva: readonly number[]
  categories: readonly string[]
  statut: StatutFiltre
}

export const FILTRES_VIDES: FiltresAvances = { tva: [], categories: [], statut: 'actifs' }

/** Onglets de la maquette ; « Autre » n'a pas d'onglet et reste visible dans « Tous ». */
export const ONGLETS: readonly { id: Onglet; libelle: string }[] = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'favoris', libelle: 'Favoris' },
  { id: 'service', libelle: 'Services' },
  { id: 'produit', libelle: 'Produits' },
  { id: 'main_oeuvre', libelle: "Main-d'œuvre" },
  { id: 'deplacement', libelle: 'Déplacements' },
  { id: 'abonnement', libelle: 'Abonnements' },
  { id: 'forfait', libelle: 'Packs / forfaits' },
]

/** Retire les catégories filtrées qui n'existent plus (supprimées entre-temps). */
export function filtresValides(f: FiltresAvances, categories: readonly CategorieArticle[]): FiltresAvances {
  const gardees = f.categories.filter((id) => categories.some((c) => c.id === id))
  return gardees.length === f.categories.length ? f : { ...f, categories: gardees }
}

/** Nombre de filtres avancés actifs (le statut par défaut « actifs » n'en est pas un). */
export const compterFiltres = (f: FiltresAvances) =>
  f.tva.length + f.categories.length + (f.statut === 'actifs' ? 0 : 1)

interface Critere {
  recherche: string
  onglet: Onglet
  filtres: FiltresAvances
  categories: readonly CategorieArticle[]
}

export function filtrerArticles(articles: readonly Article[], c: Critere): Article[] {
  const terme = sansAccent(c.recherche.trim())
  const nomCategorie = (id: string | null) => c.categories.find((x) => x.id === id)?.nom ?? ''
  return articles.filter((a) => {
    if (c.filtres.statut !== 'tous' && a.actif !== (c.filtres.statut === 'actifs')) return false
    if (c.onglet === 'favoris' ? !a.favori : c.onglet !== 'tous' && a.type !== c.onglet) return false
    if (c.filtres.tva.length && !c.filtres.tva.includes(a.tauxTva)) return false
    if (c.filtres.categories.length && !c.filtres.categories.includes(a.categorieId ?? '')) return false
    if (!terme) return true
    return sansAccent(
      `${a.nom} ${a.reference ?? ''} ${a.description} ${nomCategorie(a.categorieId)}`,
    ).includes(terme)
  })
}

const comparerTexte = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare

function valeurTri(a: Article, cle: CleTri): string | number {
  switch (cle) {
    case 'nom':
      return a.nom
    case 'type':
      return LIBELLES_TYPE_ARTICLE[a.type]
    case 'reference':
      return a.reference ?? ''
    case 'prix':
      return a.prixUnitaireHt
    case 'tva':
      return a.tauxTva
  }
}

/** Sans tri choisi : favoris d'abord, puis l'ordre du catalogue (celui du serveur). */
export function trierArticles(articles: readonly Article[], tri: Tri | null): Article[] {
  return [...articles].sort((a, b) => {
    if (!tri) return Number(b.favori) - Number(a.favori)
    const va = valeurTri(a, tri.cle)
    const vb = valeurTri(b, tri.cle)
    const ecart =
      typeof va === 'number' && typeof vb === 'number' ? va - vb : comparerTexte(String(va), String(vb))
    return tri.sens === 'asc' ? ecart : -ecart
  })
}

/** Compteurs de l'en-tête : articles actifs et favoris actifs. */
export function compterArticles(articles: readonly Article[]) {
  const actifs = articles.filter((a) => a.actif)
  return { total: actifs.length, favoris: actifs.filter((a) => a.favori).length }
}
