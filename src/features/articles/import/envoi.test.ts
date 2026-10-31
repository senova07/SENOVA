import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErreurApi } from '@/services/http'
import { envoyerLignes } from './envoi'
import { DEFAUTS_INITIAUX, ligneVide, type LigneImport } from './modele'

const { creer } = vi.hoisted(() => ({ creer: vi.fn() }))
vi.mock('@/services/articlesApi', () => ({ apiArticles: { creer } }))

const lignes = (n: number): LigneImport[] =>
  Array.from({ length: n }, (_, i) => ({ ...ligneVide(DEFAUTS_INITIAUX), nom: `A${i}`, prix: '1,00' }))

describe('envoyerLignes', () => {
  beforeEach(() => creer.mockReset())

  it('envoie en séquence et rapporte la progression', async () => {
    creer.mockResolvedValue({})
    const progression = vi.fn()
    const l = lignes(3)
    const bilan = await envoyerLignes(l, [], progression)
    expect(creer).toHaveBeenCalledTimes(3)
    expect(progression.mock.calls.map((c) => c[0])).toEqual([1, 2, 3])
    expect(bilan.crees).toEqual(l.map((x) => x.id))
    expect(bilan.nonEnvoyees).toBe(0)
    expect(bilan.arret).toBeUndefined()
  })

  it('garde le message d’un échec ordinaire et continue', async () => {
    creer.mockRejectedValueOnce(new ErreurApi(422, 'Référence déjà utilisée')).mockResolvedValue({})
    const bilan = await envoyerLignes(lignes(2), [], vi.fn())
    expect(bilan.echecs).toHaveLength(1)
    expect(bilan.echecs[0]?.message).toBe('Référence déjà utilisée')
    expect(bilan.crees).toHaveLength(1)
  })

  it('s’arrête sur session perdue et compte les lignes non envoyées', async () => {
    creer.mockResolvedValueOnce({}).mockRejectedValueOnce(new ErreurApi(401, 'Session expirée'))
    const bilan = await envoyerLignes(lignes(4), [], vi.fn())
    expect(creer).toHaveBeenCalledTimes(2)
    expect(bilan).toMatchObject({ arret: 'session', nonEnvoyees: 3 })
    expect(bilan.crees).toHaveLength(1)
    expect(bilan.echecs).toHaveLength(0)
  })

  it('s’arrête sur 429', async () => {
    creer.mockRejectedValueOnce(new ErreurApi(429, 'Trop de requêtes'))
    const bilan = await envoyerLignes(lignes(3), [], vi.fn())
    expect(creer).toHaveBeenCalledTimes(1)
    expect(bilan).toMatchObject({ arret: 'limite', nonEnvoyees: 3 })
  })

  it('s’arrête quand l’écran est quitté', async () => {
    creer.mockResolvedValue({})
    let n = 0
    const bilan = await envoyerLignes(lignes(3), [], vi.fn(), () => n++ < 1)
    expect(creer).toHaveBeenCalledTimes(1)
    expect(bilan).toMatchObject({ arret: 'interrompu', nonEnvoyees: 2 })
  })
})
