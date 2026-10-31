import { expect, it } from 'vitest'
import type { Devis } from '@/features/devis/donnees'
import { devisATraiter } from './compteurs'

const devis = (statut: Devis['statut'], dateCreation = '2026-10-01') =>
  ({ statut, dateCreation, validiteJours: 30 }) as Devis

it('compte les brouillons, les expirés et les envoyés dont la validité est dépassée', () => {
  const liste = [
    devis('brouillon'),
    devis('expire'),
    devis('envoye', '2026-01-01'), // validité dépassée
    devis('envoye', '2026-10-20'), // encore valable
    devis('accepte'),
  ]
  expect(devisATraiter(liste, '2026-10-31')).toBe(3)
})
