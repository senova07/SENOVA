import { useMemo, useState } from 'react'
import type { Article, CategorieArticle } from '@shared/articles'
import {
  FILTRES_VIDES,
  compterFiltres,
  filtrerArticles,
  filtresValides,
  trierArticles,
  type CleTri,
  type FiltresAvances,
  type Onglet,
  type Tri,
} from './filtres'

export const PAR_PAGE = 12

/** État de la vue (recherche, onglet, filtres, tri, page) et articles qui en résultent. */
export function useVueArticles(articles: readonly Article[], categories: readonly CategorieArticle[]) {
  const [recherche, setRecherche] = useState('')
  const [onglet, setOnglet] = useState<Onglet>('tous')
  const [filtresBruts, setFiltres] = useState<FiltresAvances>(FILTRES_VIDES)
  const [tri, setTri] = useState<Tri | null>(null)
  const [numero, setNumero] = useState(1)

  // Une catégorie supprimée entre-temps ne doit ni filtrer ni compter.
  const filtres = useMemo(() => filtresValides(filtresBruts, categories), [filtresBruts, categories])

  /** Tout changement de critère revient en page 1. */
  const avecPage1 =
    <T,>(changer: (v: T) => void) =>
    (v: T) => {
      changer(v)
      setNumero(1)
    }

  const visibles = trierArticles(filtrerArticles(articles, { recherche, onglet, filtres, categories }), tri)
  const pages = Math.max(1, Math.ceil(visibles.length / PAR_PAGE))
  const page = Math.min(numero, pages)
  const debut = (page - 1) * PAR_PAGE

  return {
    recherche,
    onglet,
    filtres,
    tri,
    page,
    pages,
    debut,
    total: visibles.length,
    affichees: visibles.slice(debut, debut + PAR_PAGE),
    contraint: Boolean(recherche.trim() || onglet !== 'tous' || compterFiltres(filtres) > 0),
    changerRecherche: avecPage1(setRecherche),
    changerOnglet: avecPage1(setOnglet),
    changerFiltres: avecPage1(setFiltres),
    allerPage: setNumero,
    // Troisième clic sur la même colonne : retour à l'ordre du catalogue.
    trier: avecPage1((cle: CleTri) =>
      setTri((t) => (t?.cle !== cle ? { cle, sens: 'asc' } : t.sens === 'asc' ? { cle, sens: 'desc' } : null)),
    ),
    reinitialiser: () => {
      setRecherche('')
      setOnglet('tous')
      setFiltres(FILTRES_VIDES)
      setNumero(1)
    },
  }
}
