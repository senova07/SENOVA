import { describe, expect, it } from 'vitest'
import type { CategorieArticle } from '@shared/articles'
import {
  DEFAUTS_INITIAUX as D, affecterChamp, appliquerCollage, construireLignes, correspondanceAuto, deviner, ligneVide,
  lireMontant, lireTva, lireType, lireUnite, ressembleEntetes, trierLignes, validerLignes, versSaisie, type LigneImport,
} from './modele'

const CATS: CategorieArticle[] = [{ id: '7', nom: 'Plomberie', ordre: 1 }]
const ligne = (o: Partial<LigneImport>): LigneImport => ({ ...ligneVide(D), nom: 'Vis', prix: '2,00', ...o })

describe('normalisation', () => {
  it('lit les montants', () => {
    expect(lireMontant('12,50 €')).toBe(12.5)
    expect(lireMontant('1.234,50')).toBe(1234.5)
    expect(lireMontant('65')).toBe(65)
    expect(lireMontant('1,234.50')).toBe(1234.5)
    expect(lireMontant('1.234.567')).toBe(1234567)
    expect(lireMontant('0,125')).toBe(0.125)
    expect(lireMontant('12345,678')).toBe(12345.678)
    expect(lireMontant('abc')).toBeNull()
    expect(lireMontant('-3')).toBeNull()
  })
  it('refuse les montants ambigus ou mal groupés', () => {
    expect(lireMontant('1.234')).toBeNull()
    expect(lireMontant('1,234')).toBeNull()
    expect(lireMontant('12.34,5')).toBeNull()
    expect(lireMontant('1,2,3')).toBeNull()
    expect(lireMontant('12,')).toBeNull()
  })
  it('lit la TVA', () => {
    expect(lireTva('20 %')).toBe('20')
    expect(lireTva('5,5')).toBe('5.5')
    expect(lireTva('0,2')).toBe('20')
    expect(lireTva('7')).toBe('7')
    expect(lireTva('')).toBe('')
  })
  it('lit les types par libellé ou synonyme', () => {
    expect(lireType('Main-d’œuvre', 'service')).toBe('main_oeuvre')
    expect(lireType('Déplacement', 'service')).toBe('deplacement')
    expect(lireType('fournitures', 'service')).toBe('produit')
    expect(lireType('', 'service')).toBe('service')
    expect(lireType('zzz', 'service')).toBe('')
  })
  it('lit les unités', () => {
    expect(lireUnite('heures', 'u')).toBe('h')
    expect(lireUnite('', 'u')).toBe('u')
    expect(lireUnite('palette', 'u')).toBe('palette')
  })
})

describe('validation', () => {
  it('signale les erreurs par cellule', () => {
    const l = ligne({ nom: '', prix: 'x', tva: '7', categorie: 'Inconnue' })
    const e = validerLignes([l], CATS).get(l.id)
    expect(e).toMatchObject({ nom: 'Nom obligatoire', prix: 'Prix incorrect ou ambigu', tva: 'TVA invalide' })
    expect(e?.categorie).toMatch(/inconnue/i)
  })
  it('ignore les lignes vides et repère les doublons', () => {
    const a = ligne({ reference: 'r1' })
    const b = ligne({ reference: 'R1' })
    const m = validerLignes([a, b, ligneVide(D)], CATS)
    expect(m.size).toBe(2)
    expect(m.get(a.id)?.reference).toBe('Référence en double')
  })
  it('un type non reconnu est signalé', () => {
    const l = affecterChamp(ligne({}), 'type', 'zzz', D)
    expect(validerLignes([l], CATS).get(l.id)?.type).toBe('Type inconnu')
  })
})

describe('conversion', () => {
  it('produit un ArticleSaisie', () => {
    const l = ligne({ type: 'produit', prix: '12,50', achat: '8', tva: '5.5', categorie: 'plomberie', reference: ' A1 ', favori: true })
    expect(versSaisie(l, CATS)).toEqual({
      reference: 'A1', nom: 'Vis', type: 'produit', unite: 'u', prixUnitaireHt: 12.5, tauxTva: 5.5,
      prixAchatHt: 8, categorieId: '7', favori: true,
    })
  })
})

describe('tri', () => {
  it('trie par prix numérique, vides en bas', () => {
    const [a, b] = [ligne({ prix: '10,00' }), ligne({ prix: '9,00' })]
    expect(trierLignes([ligneVide(D), a!, b!], { cle: 'prix', sens: 'asc' }).map((l) => l.prix)).toEqual(['9,00', '10,00', ''])
  })
})

describe('limites', () => {
  it('refuse un collage de plus de 2 000 lignes', () => {
    const texte = Array.from({ length: 2100 }, (_, i) => `A${i}`).join('\n')
    expect(() => appliquerCollage([ligneVide(D)], 0, 0, texte, ['nom'], D)).toThrow(/Trop de lignes/)
  })
})

describe('en-têtes et collage', () => {
  it('devine les champs', () => {
    expect(deviner('Désignation')).toBe('nom')
    expect(deviner('PU HT')).toBe('prix')
    expect(deviner('Taux TVA')).toBe('tva')
    expect(deviner('Couleur')).toBeNull()
    expect(deviner("Prix d'achat HT")).toBe('achat')
    expect(deviner('Référence article')).toBe('reference')
    expect(deviner('Prix de vente')).toBe('prix')
    expect(ressembleEntetes(['Désignation', 'PU HT'])).toBe(true)
    expect(ressembleEntetes(['Vis', '12'])).toBe(false)
  })
  it('associe automatiquement sans doublon', () => {
    expect(correspondanceAuto([['Nom', 'Désignation', 'Prix', 'Zzz']], true)).toEqual(['nom', 'ignorer', 'prix', 'ignorer'])
  })
  it('construit des lignes', () => {
    const r = construireLignes([['Vis', '2,5 €', '10 %'], ['', '', '']], ['nom', 'prix', 'tva'], D)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ nom: 'Vis', prix: '2,50', tva: '10' })
  })
  it('colle à partir d’une cellule, avec ou sans en-têtes', () => {
    const base = [ligneVide(D)]
    const sans = appliquerCollage(base, 0, 0, 'Vis\t2,5\nClou\t1', ['nom', 'prix'], D)
    expect(sans.lignes.map((l) => l.nom)).toEqual(['Vis', 'Clou'])
    expect(sans.lignes[0]?.prix).toBe('2,50')
    const avec = appliquerCollage(base, 0, 0, 'Désignation\tPU HT\nVis\t3', ['nom', 'type', 'prix'], D)
    expect(avec.lignes[0]).toMatchObject({ nom: 'Vis', prix: '3,00' })
    expect(avec.reconnues).toEqual(["Nom de l'article", 'Prix HT'])
  })
})
