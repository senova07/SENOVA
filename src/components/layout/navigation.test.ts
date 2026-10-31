import { expect, it } from 'vitest'
import { NAVIGATION, cheminActif } from './navigation'

const enfants = (id: string) => NAVIGATION.find((r) => r.id === id)?.enfants ?? []

it('une page de détail active sa liste, le préfixe le plus long l’emporte', () => {
  expect(cheminActif(enfants('ventes'), '/devis/d1', '')).toBe('/devis')
  expect(cheminActif(enfants('ventes'), '/devis/modeles/m-sobre', '')).toBeUndefined()
  expect(cheminActif(enfants('parametres'), '/devis/modeles/m-sobre', '')).toBe('/devis/modeles')
  expect(cheminActif(enfants('ventes'), '/devis/modeles', '')).toBeUndefined()
})
