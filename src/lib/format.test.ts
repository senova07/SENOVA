import { formaterDate, formaterEuro, formaterTaux, lireDecimal } from './format'

test('formaterDate garde le jour d’une date seule, quel que soit le fuseau', () => {
  expect(formaterDate('2026-10-24')).toBe('24/10/2026')
  expect(formaterDate('2026-01-01')).toBe('01/01/2026')
})

test('formaterDate lit aussi un horodatage complet', () => {
  expect(formaterDate('2026-10-24T09:30:00')).toBe('24/10/2026')
})

test('lireDecimal accepte la virgule et refuse le texte', () => {
  expect(lireDecimal(' 12,5 ')).toBe(12.5)
  expect(lireDecimal('1 234,56')).toBe(1234.56)
  expect(lireDecimal('-3')).toBe(-3)
  expect(lireDecimal('abc')).toBeNull()
  expect(lireDecimal('')).toBeNull()
})

test('formatage français des montants et taux', () => {
  expect(formaterEuro(1234.5).replace(/\s/g, ' ')).toBe('1 234,50 €')
  expect(formaterTaux(5.5)).toBe('5,5 %')
})
