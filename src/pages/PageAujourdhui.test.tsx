import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PageAujourdhui } from '@/pages/PageAujourdhui'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'

function monter() {
  const session = {
    session: { utilisateur: { nomComplet: 'Marie Durand' } },
    peut: () => true,
  } as unknown as SessionContextValue
  return render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <MemoryRouter>
          <PageAujourdhui />
        </MemoryRouter>
      </SessionContext.Provider>
    </ToastProvider>,
  )
}

describe('PageAujourdhui', () => {
  it('affiche les chiffres clés', () => {
    monter()
    const chiffres = screen.getByRole('list', { name: 'Chiffres clés' })
    for (const libelle of [
      'CA facturé du mois',
      'Encaissé ce mois',
      'Reste à encaisser',
      'Devis en attente',
    ])
      expect(within(chiffres).getByText(libelle)).toBeInTheDocument()
    expect(screen.getByText('Bonjour Marie')).toBeInTheDocument()
  })

  it('liste les factures en retard dans « À faire »', () => {
    monter()
    const bloc = screen.getByRole('region', { name: 'À faire' })
    expect(within(bloc).getByText('Garage Rossi')).toBeInTheDocument()
    expect(within(bloc).getByText(/Facture FAC-2026-0112/)).toBeInTheDocument()
    expect(within(bloc).getByText('Facturer')).toBeInTheDocument()
  })

  it('« Relancer » marque la ligne comme relancée', () => {
    monter()
    const bloc = screen.getByRole('region', { name: 'À faire' })
    const ligne = within(bloc).getByText('Garage Rossi').closest('li') as HTMLElement
    fireEvent.click(within(ligne).getByRole('button', { name: 'Relancer' }))
    expect(within(ligne).getByText("Relancé aujourd'hui")).toBeInTheDocument()
    expect(within(ligne).queryByRole('button', { name: 'Relancer' })).not.toBeInTheDocument()
  })
})
