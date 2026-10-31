import { vi } from 'vitest'

const { devis, documents } = vi.hoisted(() => ({ devis: vi.fn(), documents: vi.fn() }))
vi.mock('@/features/devis/api', () => ({ reinitialiserDemoDevis: devis }))
vi.mock('@/features/documents', () => ({ reinitialiserDemoDocuments: documents }))

const { isolerDemo } = await import('./isolationDemo')

test('remet la démo à zéro seulement quand l’organisation change', () => {
  isolerDemo('A')
  isolerDemo('A')
  expect(devis).not.toHaveBeenCalled()

  isolerDemo('B')
  expect(devis).toHaveBeenCalledTimes(1)
  expect(documents).toHaveBeenCalledTimes(1)

  isolerDemo(null) // déconnexion
  isolerDemo('B') // autre compte, même identifiant : on remet quand même à zéro au passage par null
  expect(devis).toHaveBeenCalledTimes(3)
})
