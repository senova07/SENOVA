import { expect, it } from 'vitest'
import type { Permission } from '@shared/permissions'
import { GROUPES_NAVIGATION, TOUTES_ENTREES, groupesVisibles } from './navigation'

const libelles = (peut: (p: Permission) => boolean) => groupesVisibles(peut).flatMap((g) => g.entrees.map((e) => e.libelle))

it('toutes les permissions : toutes les entrées du menu sont visibles', () => {
  expect(libelles(() => true)).toHaveLength(GROUPES_NAVIGATION.flatMap((g) => g.entrees).length)
})

it('sans permission, seules les entrées libres restent ; un groupe vide disparaît', () => {
  const visibles = libelles(() => false)
  expect(visibles).toEqual(['Aujourd’hui', 'Prestations', 'Documents', 'Dépenses', 'Partenaires', 'Automatisations', 'Intégrations'])
  expect(groupesVisibles(() => false).map((g) => g.id)).not.toContain('ventes')
})

it('une permission donnée ne montre que son entrée', () => {
  expect(libelles((p) => p === 'devis.voir')).toContain('Devis')
  expect(libelles((p) => p === 'devis.voir')).not.toContain('Factures')
})

it('les chemins sont uniques et les écrans réels sont marqués disponibles', () => {
  const chemins = TOUTES_ENTREES.map((e) => e.chemin)
  expect(new Set(chemins).size).toBe(chemins.length)
  const reels = TOUTES_ENTREES.filter((e) => e.disponible).map((e) => e.chemin)
  expect(reels).toEqual(['/', '/clients', '/devis', '/articles'])
})
