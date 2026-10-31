import { act, renderHook } from '@testing-library/react'
import { apiCharte, apiReglagesDocuments, REGLAGES_PAR_DEFAUT, reinitialiserDemoDocuments, useCharteAppliquee, useReglagesDocuments } from './api'
import { CHARTE_PAR_DEFAUT } from './rendu'

test('appliquer une charte met à jour les aperçus abonnés', async () => {
  const { result } = renderHook(() => useCharteAppliquee())
  expect(result.current).toEqual(CHARTE_PAR_DEFAUT)

  const nouvelle = { ...CHARTE_PAR_DEFAUT, modele: CHARTE_PAR_DEFAUT.modele }
  await act(() => apiCharte.appliquer(nouvelle))

  expect(result.current).toBe(nouvelle)
  await expect(apiCharte.lire()).resolves.toBe(nouvelle)
  await act(() => apiCharte.appliquer(CHARTE_PAR_DEFAUT))
})

test('appliquer des réglages met à jour les abonnés', async () => {
  const { result } = renderHook(() => useReglagesDocuments())
  expect(result.current).toBe(REGLAGES_PAR_DEFAUT)
  const nouveaux = { ...REGLAGES_PAR_DEFAUT, conditionsPaiement: 'Comptant' }
  await act(() => apiReglagesDocuments.appliquer(nouveaux))
  expect(result.current).toBe(nouveaux)
  await expect(apiReglagesDocuments.lire()).resolves.toBe(nouveaux)
  await act(() => apiReglagesDocuments.appliquer(REGLAGES_PAR_DEFAUT))
})

test('reinitialiserDemoDocuments efface charte et réglages et prévient les abonnés', async () => {
  const { result } = renderHook(() => ({ c: useCharteAppliquee(), r: useReglagesDocuments() }))
  await act(async () => {
    await apiCharte.appliquer({ ...CHARTE_PAR_DEFAUT, logo: 'data:image/png;base64,AA' })
    await apiReglagesDocuments.appliquer({ ...REGLAGES_PAR_DEFAUT, mentions: { ...REGLAGES_PAR_DEFAUT.mentions, iban: 'FR76' } })
  })
  expect(result.current.r.mentions.iban).toBe('FR76')
  act(() => reinitialiserDemoDocuments())
  expect(result.current.c).toBe(CHARTE_PAR_DEFAUT)
  expect(result.current.r).toBe(REGLAGES_PAR_DEFAUT)
})
