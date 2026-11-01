import { describe, expect, it } from 'vitest'
import type { Article } from '@shared/articles'
import { FILTRES_VIDES, compterArticles, compterFiltres, filtrerArticles, trierArticles } from './filtres'

const a = (o: Partial<Article>): Article => ({
  id: '1', reference: null, nom: 'Article', description: '', type: 'service', unite: 'u',
  prixUnitaireHt: 10, tauxTva: 20, prixAchatHt: null, categorieId: null, favori: false, actif: true, ordre: 1, ...o,
})

const LISTE = [
  a({ id: '1', nom: 'Éléctricité', prixUnitaireHt: 30, favori: true }),
  a({ id: '2', nom: 'Peinture', type: 'produit', tauxTva: 10, categorieId: 'c1', prixUnitaireHt: 5 }),
  a({ id: '3', nom: 'Ancien', actif: false }),
]
const base = { recherche: '', onglet: 'tous' as const, filtres: FILTRES_VIDES, categories: [{ id: 'c1', nom: 'Finitions', ordre: 1 }] }
const ids = (l: Article[]) => l.map((x) => x.id)

describe('filtrerArticles', () => {
  it('masque les archivés par défaut et les montre à la demande', () => {
    expect(ids(filtrerArticles(LISTE, base))).toEqual(['1', '2'])
    expect(ids(filtrerArticles(LISTE, { ...base, filtres: { ...FILTRES_VIDES, statut: 'archives' } }))).toEqual(['3'])
    expect(filtrerArticles(LISTE, { ...base, filtres: { ...FILTRES_VIDES, statut: 'tous' } })).toHaveLength(3)
  })
  it('filtre par onglet, TVA et catégorie', () => {
    expect(ids(filtrerArticles(LISTE, { ...base, onglet: 'favoris' }))).toEqual(['1'])
    expect(ids(filtrerArticles(LISTE, { ...base, onglet: 'produit' }))).toEqual(['2'])
    expect(ids(filtrerArticles(LISTE, { ...base, filtres: { ...FILTRES_VIDES, tva: [10] } }))).toEqual(['2'])
    expect(ids(filtrerArticles(LISTE, { ...base, filtres: { ...FILTRES_VIDES, categories: ['c1'] } }))).toEqual(['2'])
  })
  it('cherche sans accent ni casse, y compris dans la catégorie', () => {
    expect(ids(filtrerArticles(LISTE, { ...base, recherche: 'electri' }))).toEqual(['1'])
    expect(ids(filtrerArticles(LISTE, { ...base, recherche: 'FINITION' }))).toEqual(['2'])
  })
})

describe('trierArticles et compteurs', () => {
  it('met les favoris d’abord sans tri, sinon trie par colonne', () => {
    expect(ids(trierArticles(LISTE, null))).toEqual(['1', '2', '3'])
    expect(ids(trierArticles(LISTE, { cle: 'prix', sens: 'asc' }))).toEqual(['2', '3', '1'])
    expect(ids(trierArticles(LISTE, { cle: 'prix', sens: 'desc' }))).toEqual(['1', '3', '2'])
  })
  it('compte les articles et favoris actifs', () => {
    expect(compterArticles(LISTE)).toEqual({ total: 2, favoris: 1 })
    expect(compterFiltres({ tva: [10], categories: ['c1'], statut: 'tous' })).toBe(3)
    expect(compterFiltres(FILTRES_VIDES)).toBe(0)
  })
})
