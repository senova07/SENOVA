import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RouteProtegee } from '@/app/RouteProtegee'
import { SessionContext, type EtatSession, type SessionContextValue } from '@/store/sessionContext'

function rendre(etat: EtatSession) {
  const valeur = { etat, session: null } as SessionContextValue
  return render(
    <SessionContext.Provider value={valeur}>
      <MemoryRouter initialEntries={['/clients']}>
        <Routes>
          <Route path="/connexion" element={<p>Page connexion</p>} />
          <Route element={<RouteProtegee />}>
            <Route path="/clients" element={<p>Page clients</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  )
}

describe('RouteProtegee', () => {
  it('redirige vers /connexion sans session', () => {
    rendre('anonyme')
    expect(screen.getByText('Page connexion')).toBeInTheDocument()
  })
  it('affiche la page quand la session est ouverte', () => {
    rendre('connecte')
    expect(screen.getByText('Page clients')).toBeInTheDocument()
  })
  it('attend la session avant de décider', () => {
    rendre('chargement')
    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
  })
})
