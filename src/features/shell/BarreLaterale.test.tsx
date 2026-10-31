import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/app/AppLayout'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'
import { BarreLaterale } from './BarreLaterale'

const toutPermis = { etat: 'connecte', session: null, peut: () => true } as unknown as SessionContextValue

const sessionDeuxOrganisations = (changerOrganisation: SessionContextValue['changerOrganisation']) =>
  ({
    etat: 'connecte',
    session: {
      utilisateur: { nomComplet: 'Ada Lovelace' },
      organisation: { id: '1', nom: 'Alpha' },
      organisations: [
        { id: '1', nom: 'Alpha' },
        { id: '2', nom: 'Beta' },
      ],
    },
    peut: () => true,
    changerOrganisation,
    seDeconnecter: vi.fn(),
  }) as unknown as SessionContextValue

function Lieu() {
  const { pathname, search } = useLocation()
  return <p data-testid="lieu">{pathname + search}</p>
}

function rendreBarre(session: SessionContextValue, chemin: string) {
  return render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <MemoryRouter initialEntries={[chemin]}>
          <BarreLaterale replie={false} mobile={false} mobileOuvert={false} onBasculer={() => {}} onFermerMobile={() => {}} />
          <Lieu />
        </MemoryRouter>
      </SessionContext.Provider>
    </ToastProvider>,
  )
}

function rendreCoque(session: SessionContextValue, chemin: string) {
  return render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <MemoryRouter initialEntries={[chemin]}>
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
}

describe('BarreLaterale', () => {
  it('marque l’entrée active, y compris depuis une sous-route', () => {
    for (const [chemin, actif] of [
      ['/clients', 'Clients'],
      ['/clients/7', 'Clients'],
      ['/devis/modeles/m1', 'Devis'],
      ['/articles/x', 'Articles'],
    ] as const) {
      const { unmount } = rendreBarre(toutPermis, chemin)
      const courants = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
      expect(courants.map((l) => l.textContent)).toEqual([actif])
      unmount()
    }
  })

  it('« Aujourd’hui » n’est actif que sur la racine', () => {
    rendreBarre(toutPermis, '/clients')
    expect(screen.getByRole('link', { name: 'Aujourd’hui' })).not.toHaveAttribute('aria-current')
  })

  it('masque les entrées dont la permission manque', () => {
    const session = { ...toutPermis, peut: (p: string) => p === 'clients.voir' } as SessionContextValue
    rendreBarre(session, '/')
    expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument()
    for (const nom of ['Devis', 'Factures', 'Paiements', 'Articles', 'Équipe', 'Paramètres']) {
      expect(screen.queryByRole('link', { name: nom })).not.toBeInTheDocument()
    }
    // Les entrées sans permission restent visibles.
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument()
  })

  it('n’a aucun sélecteur d’entreprise : le changement passe par le menu du compte', () => {
    rendreBarre(sessionDeuxOrganisations(vi.fn()), '/')
    expect(screen.queryByRole('button', { name: /entreprise/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2)
  })

  it('affiche le compteur fourni avec son texte pour lecteur d’écran', () => {
    render(
      <ToastProvider>
        <SessionContext.Provider value={toutPermis}>
          <MemoryRouter>
            <BarreLaterale
              replie={false}
              mobile={false}
              mobileOuvert={false}
              onBasculer={() => {}}
              onFermerMobile={() => {}}
              compteurs={{ '/devis': { valeur: 2 }, '/factures': { valeur: 1, alerte: true } }}
            />
          </MemoryRouter>
        </SessionContext.Provider>
      </ToastProvider>,
    )
    expect(screen.getByRole('link', { name: /Devis: 2 à traiter/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Factures: 1 en retard/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument()
  })

  it('le menu Nouveau ouvre la création, et un raccourci agit', () => {
    rendreBarre(toutPermis, '/')
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Nouveau devis/ }))
    expect(screen.getByTestId('lieu')).toHaveTextContent('/devis?nouveau=1')

    fireEvent.click(screen.getByRole('button', { name: 'Nouveau' }))
    fireEvent.keyDown(document, { key: 'c' })
    expect(screen.getByTestId('lieu')).toHaveTextContent('/clients?nouveau=1')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('une création sans écran donne un toast honnête', async () => {
    rendreBarre(toutPermis, '/')
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Nouvelle facture/ }))
    expect(await screen.findByText('Bientôt disponible')).toBeInTheDocument()
    expect(screen.getByTestId('lieu')).toHaveTextContent('/')
  })
})

describe('coque', () => {
  it('change d’organisation via le menu du compte : retour à l’accueil depuis une fiche, toast d’erreur sinon', async () => {
    const changerOrganisation = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Refusé'))
    rendreCoque(sessionDeuxOrganisations(changerOrganisation), '/clients/7')
    const barre = within(screen.getByRole('complementary', { name: 'Navigation principale' }))
    const ouvrirEtChoisir = () => {
      fireEvent.click(barre.getByRole('button', { name: /Ada Lovelace/ }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Beta' }))
    }
    ouvrirEtChoisir()
    expect(await screen.findByText('Accueil')).toBeInTheDocument()

    ouvrirEtChoisir()
    expect(await screen.findByText('Refusé')).toBeInTheDocument()
    await waitFor(() => expect(changerOrganisation).toHaveBeenCalledTimes(2))
  })

  it('l’avatar de la barre du haut ouvre le même menu et propose la déconnexion', () => {
    const session = sessionDeuxOrganisations(vi.fn())
    rendreCoque(session, '/')
    fireEvent.click(screen.getByRole('button', { name: 'Compte de Ada Lovelace' }))
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Se déconnecter' }))
    expect(session.seDeconnecter).toHaveBeenCalled()
  })

  it('sans autre organisation, le menu du compte ne propose que la déconnexion', () => {
    const session = sessionDeuxOrganisations(vi.fn())
    if (session.session) session.session.organisations = [{ id: '1', nom: 'Alpha' }]
    rendreCoque(session, '/')
    fireEvent.click(screen.getByRole('button', { name: 'Compte de Ada Lovelace' }))
    expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Se déconnecter' })).toBeInTheDocument()
  })

  it('se replie et se déplie, et retient le choix', () => {
    localStorage.removeItem('senova.sidebar.repliee')
    rendreCoque(toutPermis, '/')
    const barre = screen.getByRole('complementary', { name: 'Navigation principale' })
    fireEvent.click(screen.getByRole('button', { name: 'Réduire le menu' }))
    expect(barre).toHaveAttribute('data-replie', 'true')
    expect(localStorage.getItem('senova.sidebar.repliee')).toBe('1')
    // Les libellés restent le nom accessible des liens, et l’infobulle apparaît au focus.
    const lien = within(barre).getByRole('link', { name: 'Clients' })
    fireEvent.focus(lien)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Clients')
    fireEvent.click(screen.getByRole('button', { name: 'Déplier le menu' }))
    expect(barre).toHaveAttribute('data-replie', 'false')
    expect(localStorage.getItem('senova.sidebar.repliee')).toBe('0')
  })

  it('la barre du haut n’annonce aucune notification non lue', () => {
    rendreCoque(toutPermis, '/')
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })
})
