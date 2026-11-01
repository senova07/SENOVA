import { describe, expect, it } from 'vitest'
import { ErreurTableau, analyserCollage, analyserCsv, detecterSeparateur, estFichierExcel, estFichierTexte } from './csv'

describe('analyserCsv', () => {
  it('détecte le point-virgule', () => {
    expect(analyserCsv('nom;prix\nVis;1,50\n')).toEqual([['nom', 'prix'], ['Vis', '1,50']])
  })
  it('détecte la virgule et la tabulation', () => {
    expect(detecterSeparateur('a,b,c')).toBe(',')
    expect(detecterSeparateur('a\tb\tc')).toBe('\t')
  })
  it('ignore le séparateur entre guillemets pour la détection', () => {
    expect(detecterSeparateur('"a,b,c";d')).toBe(';')
  })
  it('gère BOM, CRLF et lignes vides', () => {
    expect(analyserCsv('﻿nom;prix\r\nVis;2\r\n\r\n;\r\n')).toEqual([['nom', 'prix'], ['Vis', '2']])
  })
  it('gère guillemets, guillemets échappés et retours à la ligne dans une cellule', () => {
    expect(analyserCsv('nom;note\n"Vis; inox";"dit ""ok"""\n"a\nb";c')).toEqual([
      ['nom', 'note'],
      ['Vis; inox', 'dit "ok"'],
      ['a\nb', 'c'],
    ])
  })
  it('renvoie une matrice vide pour un texte vide', () => {
    expect(analyserCsv('  \n ')).toEqual([])
  })
})

describe('limites et robustesse', () => {
  it('signale un guillemet non fermé', () => {
    expect(() => analyserCsv('nom;prix\n"Vis;2')).toThrow(ErreurTableau)
  })
  it('refuse plus de 2 000 lignes', () => {
    expect(() => analyserCsv(Array.from({ length: 2100 }, (_, i) => `a;${i}`).join('\n'))).toThrow(/Trop de lignes/)
  })
  it('retire les retours à la ligne de fin sans temps quadratique', () => {
    const debut = Date.now()
    expect(analyserCollage('a\tb' + '\n'.repeat(300000))).toEqual([['a', 'b']])
    expect(Date.now() - debut).toBeLessThan(1000)
  })
})

describe('analyserCollage', () => {
  it('découpe en tabulations', () => {
    expect(analyserCollage('a\tb\r\nc\td\r\n')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('extensions', () => {
  it('reconnaît Excel et texte', () => {
    expect(estFichierExcel('Catalogue.XLSX')).toBe(true)
    expect(estFichierExcel('a.xls')).toBe(true)
    expect(estFichierTexte('a.csv')).toBe(true)
    expect(estFichierTexte('a.xlsx')).toBe(false)
  })
})
