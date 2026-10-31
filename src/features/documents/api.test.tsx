import { act, renderHook } from '@testing-library/react'
import { apiCharte, useCharteAppliquee } from './api'
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
