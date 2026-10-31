import { describe, expect, it } from 'vitest'
import { calculerTotaux, sousTotalSection, type LigneDevis } from './donnees'

const l = (genre: LigneDevis['genre'], quantite: number, prix: number, tva = 20): LigneDevis => ({
  id: Math.random().toString(),
  genre,
  designation: genre,
  quantite,
  unite: 'u',
  prixUnitaireHt: prix,
  tauxTva: tva,
  remisePourcent: 0,
})

describe('calculerTotaux', () => {
  it('somme par taux et ignore sections et textes', () => {
    const t = calculerTotaux(
      [l('section', 0, 0), l('article', 2, 100), l('article', 1, 100, 10), l('texte', 0, 0)],
      { mode: 'pourcent', valeur: 0 },
    )
    expect(t.totalHt).toBe(300)
    expect(t.tva).toEqual([
      { taux: 10, base: 100, montant: 10 },
      { taux: 20, base: 200, montant: 40 },
    ])
    expect(t.totalTtc).toBe(350)
  })

  it('garde une remise en euros fixe et la répartit au prorata', () => {
    const t = calculerTotaux([l('article', 1, 300), l('article', 1, 100, 10)], {
      mode: 'montant',
      valeur: 40,
    })
    expect(t.remiseMontant).toBe(40)
    expect(t.totalHt).toBe(360)
    expect(t.tva.map((x) => x.base)).toEqual([90, 270])
  })

  it('reporte l’écart d’arrondi sur la dernière base et calcule l’acompte', () => {
    const t = calculerTotaux(
      [l('article', 1, 100), l('article', 1, 100, 10), l('article', 1, 100, 5.5)],
      { mode: 'montant', valeur: 10 },
      30,
    )
    expect(t.tva.reduce((a, x) => a + x.base, 0)).toBeCloseTo(t.totalHt, 10)
    expect(t.acompte).toBe(Math.round(t.totalTtc * 30) / 100)
  })

  it('plafonne la remise au total', () => {
    expect(calculerTotaux([l('article', 1, 50)], { mode: 'montant', valeur: 80 }).totalHt).toBe(0)
  })
})

it('sousTotalSection s’arrête à la section suivante', () => {
  const lignes = [
    l('section', 0, 0),
    l('article', 1, 10),
    l('article', 2, 5),
    l('section', 0, 0),
    l('article', 1, 99),
  ]
  expect(sousTotalSection(lignes, 0)).toBe(20)
  expect(sousTotalSection(lignes, 3)).toBe(99)
})
