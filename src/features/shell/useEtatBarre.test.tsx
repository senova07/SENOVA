import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { useEtatBarre } from './useEtatBarre'

afterEach(() => vi.unstubAllGlobals())

it('sur mobile, le tiroir se ferme à toute navigation, même vers le même chemin', () => {
  vi.stubGlobal('matchMedia', (requete: string) => ({
    matches: true,
    media: requete,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  const enveloppe = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/clients']}>{children}</MemoryRouter>
  )
  const { result } = renderHook(() => ({ etat: useEtatBarre(), aller: useNavigate() }), { wrapper: enveloppe })
  act(() => result.current.etat.ouvrirMobile())
  expect(result.current.etat.mobileOuvert).toBe(true)
  act(() => result.current.aller('/clients?nouveau=1'))
  expect(result.current.etat.mobileOuvert).toBe(false)
})
