import { describe, expect, it } from 'vitest'
import {
  bornerPourcent,
  calculerTotaux,
  decalerLigne,
  deplacerLigne,
  numeroSuivant,
  sousTotalSection,
  totalLigneHt,
  totauxDevis,
} from './calculs'
import type { LigneDevis } from './types'

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

describe('remise par ligne et acompte', () => {
  it('applique la remise de la ligne avant les totaux', () => {
    const ligne = { ...l('article', 2, 100), remisePourcent: 10 }
    expect(totalLigneHt(ligne)).toBe(180)
    expect(totalLigneHt({ ...ligne, genre: 'section' })).toBe(0)
  })

  it('totauxDevis reprend remise globale et acompte du devis', () => {
    const t = totauxDevis({
      lignes: [l('article', 1, 100)],
      remise: { mode: 'pourcent', valeur: 10 },
      acomptePourcent: 30,
    })
    // 100 − 10 = 90 HT, TVA 18, TTC 108, acompte 32,40
    expect(t.totalTtc).toBe(108)
    expect(t.acompte).toBe(32.4)
  })

  it('borne un pourcentage entre 0 et 100', () => {
    expect([bornerPourcent(-5), bornerPourcent(42), bornerPourcent(250), bornerPourcent(NaN)]).toEqual([
      0, 42, 100, 0,
    ])
  })
})

describe('réordonnancement', () => {
  const a = { ...l('article', 1, 1), id: 'a' }
  const b = { ...l('article', 1, 1), id: 'b' }
  const c = { ...l('article', 1, 1), id: 'c' }
  const ids = (x: LigneDevis[]) => x.map((i) => i.id).join('')

  it('deplacerLigne place avant ou après la cible', () => {
    expect(ids(deplacerLigne([a, b, c], 'a', 'c', true))).toBe('bca')
    expect(ids(deplacerLigne([a, b, c], 'c', 'a', false))).toBe('cab')
    expect(ids(deplacerLigne([a, b, c], 'a', 'zz', true))).toBe('abc')
  })

  it('decalerLigne échange avec la voisine et s’arrête aux bouts', () => {
    expect(ids(decalerLigne([a, b, c], 'a', 1))).toBe('bac')
    expect(ids(decalerLigne([a, b, c], 'a', -1))).toBe('abc')
    expect(ids(decalerLigne([a, b, c], 'c', 1))).toBe('abc')
  })
})

it('numeroSuivant incrémente le plus grand numéro', () => {
  expect(numeroSuivant([{ numero: 'DEV-2026-0042' }, { numero: 'DEV-2026-0007' }])).toBe(
    'DEV-2026-0043',
  )
  expect(numeroSuivant([])).toBe('DEV-2026-0001')
})

describe('cas limites', () => {
  it('arrondit au centime une quantité décimale', () => {
    // 2,5 × 33,33 = 83,325 : le flottant tombe à 83,32 ou 83,33, jamais hors centime
    expect([83.32, 83.33]).toContain(totalLigneHt(l('article', 2.5, 33.33)))
  })

  it('gère un taux de TVA à 0 %', () => {
    const t = calculerTotaux([l('article', 1, 100, 0)], { mode: 'pourcent', valeur: 0 })
    expect(t.totalTva).toBe(0)
    expect(t.totalTtc).toBe(100)
  })

  it('plafonne une remise en % supérieure à 100', () => {
    const t = calculerTotaux([l('article', 1, 80)], { mode: 'pourcent', valeur: 150 })
    expect(t.remiseMontant).toBe(80)
    expect(t.totalHt).toBe(0)
    expect(t.totalTtc).toBe(0)
  })

  it('HT + TVA = TTC au centime avec plusieurs taux et une remise', () => {
    const t = calculerTotaux(
      [l('article', 3, 19.99), l('article', 7, 3.33, 10), l('article', 1, 41.17, 5.5)],
      { mode: 'pourcent', valeur: 7 },
    )
    expect(Math.round((t.totalHt + t.totalTva) * 100)).toBe(Math.round(t.totalTtc * 100))
    expect(Math.round(t.tva.reduce((a, x) => a + x.base, 0) * 100)).toBe(Math.round(t.totalHt * 100))
  })
})
