import { describe, expect, it } from 'vitest'
import { pluriel, sansAccent } from './texte'

describe('sansAccent', () => {
  it('retire les accents et la casse', () => {
    expect(sansAccent('Éléonore Ça Été')).toBe('eleonore ca ete')
  })
  it('laisse le texte sans accent inchangé', () => {
    expect(sansAccent('plomberie 12')).toBe('plomberie 12')
  })
})

describe('pluriel', () => {
  it('accorde selon le nombre', () => {
    expect(pluriel(0, 'ligne')).toBe('0 ligne')
    expect(pluriel(1, 'ligne')).toBe('1 ligne')
    expect(pluriel(3, 'ligne')).toBe('3 lignes')
  })
  it('ne double pas un s final', () => {
    expect(pluriel(2, 'devis')).toBe('2 devis')
  })
})
