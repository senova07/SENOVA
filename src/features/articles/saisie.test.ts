import { describe, expect, it } from 'vitest'
import { lireDecimal } from '@/lib/format'
import type { Article } from '@shared/articles'
import { brouillonDe, saisieDe, valider, versSaisie } from './saisie'

const article: Article = {
  id: '1', reference: 'R-1', nom: 'Pose', description: 'Détail', type: 'service', unite: 'm²',
  prixUnitaireHt: 12.5, tauxTva: 5.5, prixAchatHt: null, categorieId: '7', favori: true, actif: true, ordre: 1,
}

describe('valider', () => {
  it('exige nom, unité, prix HT et TVA valides', () => {
    const e = valider({ ...brouillonDe(null), unite: ' ', prixHt: 'abc', tva: '120' })
    expect(Object.keys(e).sort()).toEqual(['nom', 'prixHt', 'tva', 'unite'])
  })
  it('contrôle le prix d’achat seulement s’il est renseigné', () => {
    const ok = { ...brouillonDe(null), nom: 'A', prixHt: '1' }
    expect(valider(ok)).toEqual({})
    expect(valider({ ...ok, prixAchat: '-2' }).prixAchat).toBeDefined()
  })
})

describe('versSaisie et saisieDe', () => {
  it('lit « 12,5 », vide le prix d’achat et passe la catégorie en nombre', () => {
    const b = { ...brouillonDe(null), nom: ' A ', prixHt: '12,5', prixAchat: '  ', categorieId: '3' }
    expect(versSaisie(b, true)).toMatchObject({ nom: 'A', prixUnitaireHt: 12.5, prixAchatHt: null, categorieId: 3, actif: true })
  })
  it('refait un aller-retour fidèle et applique les changements', () => {
    expect(saisieDe(article, {})).toMatchObject({
      nom: 'Pose', reference: 'R-1', prixUnitaireHt: 12.5, tauxTva: 5.5, categorieId: 7, favori: true, actif: true,
    })
    expect(saisieDe(article, { actif: false }).actif).toBe(false)
  })
})

describe('lireDecimal', () => {
  it('accepte les espaces et la virgule, refuse les séparateurs de milliers ambigus', () => {
    expect(lireDecimal('1 234,56')).toBe(1234.56)
    expect(lireDecimal('1.234,56')).toBeNull()
  })
})
