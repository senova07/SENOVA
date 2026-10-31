import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { apiClients } from '@/services/clientsApi'
import type { Client } from '@shared/clients'
import { ToastProvider } from '@/store/ToastProvider'
import { DEVIS_DEMO } from './demo'
import { magasinDevis } from './magasin'
import { PageDevis } from './PageDevis'

function Lieu() {
  const { pathname, search } = useLocation()
  return <p data-testid="lieu">{pathname + search}</p>
}

function monter(url = '/devis', strict = false) {
  const arbre = (
    <ToastProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/devis" element={<PageDevis />} />
          <Route path="*" element={<Lieu />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  )
  return render(strict ? <StrictMode>{arbre}</StrictMode> : arbre)
}

const lignesTableau = () => screen.getAllByRole('row').slice(1)

describe('PageDevis', () => {
  it('les onglets filtrent la liste et affichent leur compteur', () => {
    monter('/devis')
    expect(lignesTableau()).toHaveLength(DEVIS_DEMO.length)
    fireEvent.click(screen.getByRole('tab', { name: /Refusés/ }))
    // refusé + expiré
    expect(lignesTableau()).toHaveLength(2)
    expect(screen.getByRole('tab', { name: /^Brouillons\s*1$/ })).toBeTruthy()
  })

  it('la recherche filtre par client et propose de réinitialiser quand rien ne correspond', () => {
    monter('/devis')
    const champ = screen.getByRole('searchbox', { name: 'Rechercher un devis' })
    fireEvent.change(champ, { target: { value: 'rossi' } })
    expect(lignesTableau()).toHaveLength(1)
    fireEvent.change(champ, { target: { value: 'zzz' } })
    expect(screen.getByText('Aucun devis ne correspond')).toBeTruthy()
  })

  it('Nouveau devis crée un brouillon et ouvre sa page', async () => {
    const avant = magasinDevis.lire().length
    monter('/devis')
    fireEvent.click(screen.getByRole('button', { name: /Nouveau devis/ }))
    expect((await screen.findByTestId('lieu')).textContent).toBe(`/devis/${magasinDevis.lire()[0]!.id}`)
    expect(magasinDevis.lire()).toHaveLength(avant + 1)
  })

  it('?nouveau=1 crée un seul brouillon, même en StrictMode', async () => {
    const avant = magasinDevis.lire().length
    monter('/devis?nouveau=1', true)
    expect((await screen.findByTestId('lieu')).textContent).toMatch(/^\/devis\/\w+$/)
    expect(magasinDevis.lire()).toHaveLength(avant + 1)
  })

  it('« Apparence des documents » mène à l’écran Apparence', () => {
    monter('/devis')
    fireEvent.click(screen.getByRole('button', { name: 'Apparence des documents' }))
    expect(screen.getByTestId('lieu').textContent).toBe('/documents/apparence')
  })

  it('supprime un brouillon après confirmation', async () => {
    monter('/devis')
    fireEvent.click(screen.getByRole('tab', { name: /Brouillons/ }))
    const avant = magasinDevis.lire().length
    fireEvent.click(screen.getAllByRole('button', { name: /^Actions : / })[0]!)
    fireEvent.click(screen.getByRole('menuitem', { name: /Supprimer/ }))
    const modale = screen.getByRole('dialog', { name: 'Supprimer ce brouillon ?' })
    fireEvent.click(within(modale).getByRole('button', { name: /Supprimer/ }))
    await waitFor(() => expect(magasinDevis.lire()).toHaveLength(avant - 1))
  })

  it('?nouveau=1&client= préremplit le brouillon depuis la fiche client', async () => {
    const fiche = {
      id: 'c1',
      nature: 'particulier',
      nom: 'Durand',
      prenom: 'Léa',
      email: 'lea@mail.fr',
      adresses: [
        {
          id: 'a',
          libelle: '',
          ligne1: '3 rue X',
          ligne2: null,
          codePostal: '69001',
          ville: 'Lyon',
          pays: 'FR',
          parDefaut: true,
        },
      ],
    } as unknown as Client
    vi.spyOn(apiClients, 'lire').mockResolvedValue(fiche)
    const avant = magasinDevis.lire().length
    monter('/devis?nouveau=1&client=c1', true)
    expect(await screen.findByTestId('lieu')).toBeTruthy()
    expect(magasinDevis.lire()).toHaveLength(avant + 1)
    const d = magasinDevis.lire()[0]!
    expect(d.clientNom).toBe('Léa Durand')
    expect(d.clientAdresse).toBe('3 rue X\n69001 Lyon')
    expect(d.clientEmail).toBe('lea@mail.fr')
  })

  it('crée quand même un brouillon vide si la fiche client est introuvable', async () => {
    vi.spyOn(apiClients, 'lire').mockRejectedValue(new Error('404'))
    const avant = magasinDevis.lire().length
    monter('/devis?nouveau=1&client=zz', true)
    expect(await screen.findByTestId('lieu')).toBeTruthy()
    expect(magasinDevis.lire()).toHaveLength(avant + 1)
    expect(magasinDevis.lire()[0]!.clientNom).toBe('')
  })
})
