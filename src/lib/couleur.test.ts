import { describe, expect, it } from 'vitest'
import {
  couleurTexteLisible, estHexValide, extrairePalettes, hexVersRvb, hexVersTsl, luminance, melangerAvecBlanc,
  normaliserHex, PALETTES_LOGO_PAR_DEFAUT, rapportContraste, rvbVersHex, tslVersHex,
} from './couleur'

describe('hex', () => {
  it('normalise 3 caractères, casse et dièse', () => {
    expect(normaliserHex('#abc')).toBe('#AABBCC')
    expect(normaliserHex(' 0b2a50 ')).toBe('#0B2A50')
  })
  it('rejette les valeurs invalides', () => {
    for (const v of ['', '#12', '#12345', 'GGGGGG', '#1234567', 'rouge']) expect(estHexValide(v)).toBe(false)
    expect(hexVersRvb('zz')).toBeNull()
  })
  it('convertit hex et RVB dans les deux sens, en bornant', () => {
    expect(hexVersRvb('#16B8B0')).toEqual({ r: 22, g: 184, b: 176 })
    expect(rvbVersHex(22, 184, 176)).toBe('#16B8B0')
    expect(rvbVersHex(-5, 300, 0)).toBe('#00FF00')
  })
})

describe('TSL', () => {
  it('convertit les primaires', () => {
    expect(hexVersTsl('#FF0000')).toEqual({ t: 0, s: 1, l: 0.5 })
    expect(hexVersTsl('#FFFFFF')).toEqual({ t: 0, s: 0, l: 1 })
  })
  it('revient au même hex', () => {
    for (const h of ['#0B2A50', '#16B8B0', '#8E1B2B', '#808080']) expect(tslVersHex(hexVersTsl(h))).toBe(h)
  })
})

describe('TSL, cas limites', () => {
  it('normalise une teinte hors 0-360', () => {
    expect(tslVersHex({ t: -120, s: 1, l: 0.5 })).toBe(tslVersHex({ t: 240, s: 1, l: 0.5 }))
    expect(tslVersHex({ t: 480, s: 1, l: 0.5 })).toBe(tslVersHex({ t: 120, s: 1, l: 0.5 }))
    expect(tslVersHex({ t: 360, s: 1, l: 0.5 })).toBe('#FF0000')
  })
})

describe('mélange et contraste', () => {
  it('mélange avec le blanc', () => {
    expect(melangerAvecBlanc('#000000', 0)).toBe('#FFFFFF')
    expect(melangerAvecBlanc('#0B2A50', 1)).toBe('#0B2A50')
    expect(melangerAvecBlanc('#000000', 0.5)).toBe('#808080')
  })
  it('noir sur blanc vaut 21, identique vaut 1', () => {
    expect(rapportContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(rapportContraste('#FFFFFF', '#000000')).toBeCloseTo(21, 5)
    expect(rapportContraste('#16B8B0', '#16B8B0')).toBe(1)
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5)
  })
  it('choisit un texte lisible', () => {
    expect(couleurTexteLisible('#0B2A50')).toBe('#FFFFFF')
    expect(couleurTexteLisible('#FFFFFF')).toBe('#18253A')
    expect(couleurTexteLisible('#E6F7F6')).toBe('#18253A')
  })
  it('bascule autour du seuil de 3,2 contre le blanc', () => {
    // #959595 : contraste ~3,03 (sombre) ; #8C8C8C : ~3,43 (blanc)
    expect(rapportContraste('#959595', '#FFFFFF')).toBeLessThan(3.2)
    expect(couleurTexteLisible('#959595')).toBe('#18253A')
    expect(rapportContraste('#8C8C8C', '#FFFFFF')).toBeGreaterThanOrEqual(3.2)
    expect(couleurTexteLisible('#8C8C8C')).toBe('#FFFFFF')
  })
})

describe('extrairePalettes', () => {
  const pixel = (r: number, g: number, b: number, a = 255, n = 1) => Array<number[]>(n).fill([r, g, b, a]).flat()
  it('renvoie les palettes par défaut sans couleur exploitable', () => {
    expect(extrairePalettes([])).toBe(PALETTES_LOGO_PAR_DEFAUT)
    expect(extrairePalettes([...pixel(255, 255, 255, 255, 5), ...pixel(10, 10, 10, 0, 5)])).toBe(PALETTES_LOGO_PAR_DEFAUT)
  })
  it('gère une image unie et une longueur non multiple de 4', () => {
    const unie = extrairePalettes(pixel(11, 42, 80, 255, 20))
    expect(unie).toHaveLength(3)
    expect(unie[0]?.[0]).toBe('#0B2A50')
    expect(unie.flat().every((h) => /^#[0-9A-F]{6}$/.test(h))).toBe(true)
    expect(extrairePalettes([...pixel(11, 42, 80, 255, 3), 1, 2, 3])).toHaveLength(3)
    expect(extrairePalettes([1, 2, 3])).toBe(PALETTES_LOGO_PAR_DEFAUT)
  })
  it('place la couleur la plus sombre en principale et trouve un accent vif', () => {
    const palettes = extrairePalettes([...pixel(11, 42, 80, 255, 10), ...pixel(22, 184, 176, 255, 6)])
    expect(palettes).toHaveLength(3)
    expect(palettes[0]?.slice(0, 2)).toEqual(['#0B2A50', '#16B8B0'])
  })
})
