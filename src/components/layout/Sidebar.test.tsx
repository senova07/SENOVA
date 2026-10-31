import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/components/layout/AppLayout'
import { Sidebar } from '@/components/layout/Sidebar'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'

const valeur = { etat: 'connecte', session: null } as SessionContextValue

describe('Sidebar', () => {
  it('marque l’item actif ; icônes en trait simple', () => {
    render(
      <ToastProvider>
        <SessionContext.Provider value={valeur}>
          <MemoryRouter initialEntries={['/clients']}>
            <Sidebar repliee={false} onBasculer={() => {}} />
          </MemoryRouter>
        </SessionContext.Provider>
      </ToastProvider>,
    )
    const actif = screen.getByRole('link', { name: 'Clients' })
    expect(actif).toHaveAttribute('aria-current', 'page')
    expect(actif.querySelector('svg')).toHaveAttribute('data-poids', 'regular')
    const autre = screen.getByRole('link', { name: 'Documents' })
    expect(autre.querySelector('svg')).toHaveAttribute('data-poids', 'regular')
  })

  it('change d\'organisation : retour à l\'accueil depuis une fiche, erreur en toast sinon', async () => {
    const changerOrganisation = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Refusé'))
    const session = {
      etat: 'connecte',
      session: {
        utilisateur: { nomComplet: 'Ada Lovelace' },
        organisation: { id: '1', nom: 'Alpha' },
        organisations: [
          { id: '1', nom: 'Alpha' },
          { id: '2', nom: 'Beta' },
        ],
      },
      changerOrganisation,
      seDeconnecter: vi.fn(),
    } as unknown as SessionContextValue
    render(
      <ToastProvider>
        <SessionContext.Provider value={session}>
          <MemoryRouter initialEntries={['/clients/7']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<p>Accueil</p>} />
                <Route path="/clients/:id" element={<p>Fiche</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </SessionContext.Provider>
      </ToastProvider>,
    )
    const ouvrirEtChoisir = (nom: string) => {
      fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: nom }))
    }
    ouvrirEtChoisir('Beta')
    expect(await screen.findByText('Accueil')).toBeInTheDocument()

    ouvrirEtChoisir('Beta')
    expect(await screen.findByText('Refusé')).toBeInTheDocument()
    await waitFor(() => expect(changerOrganisation).toHaveBeenCalledTimes(2))
  })

  it('se replie et se déplie depuis la sidebar, et retient le choix', () => {
    localStorage.removeItem('senova.sidebar.repliee')
    const { container } = render(
      <ToastProvider>
        <SessionContext.Provider value={valeur}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<p>Accueil</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </SessionContext.Provider>
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Replier le menu' }))
    expect(container.querySelector('.app')).toHaveClass('app--replie')
    expect(localStorage.getItem('senova.sidebar.repliee')).toBe('1')
    // Les libellés restent le nom accessible des liens.
    const sidebar = screen.getByRole('complementary', { name: 'Menu principal' })
    expect(within(sidebar).getByRole('link', { name: 'Clients' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Déplier le menu' }))
    expect(container.querySelector('.app')).not.toHaveClass('app--replie')
  })

  it('ouvre la rubrique de la page courante et marque la sous-page active', () => {
    render(
      <ToastProvider>
        <SessionContext.Provider value={valeur}>
          <MemoryRouter initialEntries={['/articles?onglet=forfaits']}>
            <Sidebar repliee={false} onBasculer={() => {}} />
          </MemoryRouter>
        </SessionContext.Provider>
      </ToastProvider>,
    )
    expect(screen.getByRole('button', { name: 'Catalogue' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Packs / forfaits' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Articles' })).not.toHaveAttribute('aria-current')
    // Une seule rubrique ouverte à la fois.
    fireEvent.click(screen.getByRole('button', { name: 'Ventes' }))
    expect(screen.getByRole('link', { name: 'Factures' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Packs / forfaits' })).not.toBeInTheDocument()
  })
})
