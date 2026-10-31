import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PageClients } from '@/features/clients/PageClients'
import { PageFicheClient } from '@/features/clients/PageFicheClient'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'
import type { Client } from '@shared/clients'

const client = (o: Partial<Client>): Client => ({
  id: '1',
  nature: 'particulier',
  nom: 'Martin',
  prenom: 'Claire',
  email: 'claire@exemple.fr',
  telephone: '0601020304',
  siren: null,
  siret: null,
  tvaIntracom: null,
  notes: null,
  tags: ['fidèle'],
  archiveLe: null,
  archiveMotif: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...o,
})

const LISTE = [
  client({}),
  client({ id: '2', nature: 'entreprise', nom: 'Batimex', prenom: null, tags: [] }),
]
const FICHE = client({
  adresses: [
    {
      id: '10',
      libelle: 'Principale',
      ligne1: '3 rue Haute',
      ligne2: null,
      codePostal: '69001',
      ville: 'Lyon',
      pays: 'FR',
      parDefaut: true,
    },
  ],
  contacts: [],
})

let appels: { methode: string; url: string; corps?: unknown }[]

const json = (donnees: unknown, status = 200) =>
  new Response(JSON.stringify(donnees), { status, headers: { 'content-type': 'application/json' } })

function mockApi(fiche: () => Response = () => json(FICHE)) {
  appels = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const methode = init?.method ?? 'GET'
      appels.push({ methode, url, corps: init?.body ? JSON.parse(String(init.body)) : undefined })
      if (methode === 'GET' && url.startsWith('/api/clients?'))
        return json({ donnees: LISTE, total: 2, page: 1, parPage: 25 })
      if (methode === 'GET') return fiche()
      if (methode === 'PUT') return json(FICHE)
      if (url.endsWith('/archiver'))
        return json({ ...FICHE, archiveLe: '2026-02-01T00:00:00.000Z' })
      return json(client({ id: '9', nature: 'entreprise', nom: 'Nouvelle SARL' }), 201)
    }),
  )
}

function monter(chemin: string) {
  const session = { peut: () => true } as unknown as SessionContextValue
  return render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <MemoryRouter initialEntries={[chemin]}>
          <Routes>
            <Route path="/clients" element={<PageClients />} />
            <Route path="/clients/:id" element={<PageFicheClient />} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </ToastProvider>,
  )
}

describe('Clients', () => {
  beforeEach(() => mockApi())
  afterEach(() => vi.unstubAllGlobals())

  it('liste les clients et lance la recherche côté serveur', async () => {
    monter('/clients')
    expect(await screen.findByText('Claire Martin')).toBeInTheDocument()
    expect(screen.getByText('Batimex')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bati' } })
    await waitFor(() => expect(appels.some((a) => a.url.includes('recherche=bati'))).toBe(true))
    expect(appels.find((a) => a.url.includes('recherche=bati'))?.url).toContain('archives=0')
  })

  it('crée une entreprise avec SIRET (champs réservés à l’entreprise)', async () => {
    monter('/clients')
    await screen.findByText('Batimex')
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau client' }))
    const modale = await screen.findByRole('dialog')

    expect(within(modale).queryByLabelText('SIRET')).not.toBeInTheDocument()
    fireEvent.change(within(modale).getByLabelText('Nature'), { target: { value: 'entreprise' } })
    expect(within(modale).getByLabelText('Raison sociale')).toBeInTheDocument()

    fireEvent.change(within(modale).getByLabelText('Raison sociale'), {
      target: { value: 'Nouvelle SARL' },
    })
    fireEvent.change(within(modale).getByLabelText('SIRET'), {
      target: { value: '12345678901234' },
    })
    fireEvent.click(within(modale).getByRole('button', { name: 'Ajouter une adresse' }))
    fireEvent.change(within(modale).getByLabelText('Adresse'), { target: { value: '1 rue Neuve' } })
    fireEvent.change(within(modale).getByLabelText('Code postal'), { target: { value: '75001' } })
    fireEvent.change(within(modale).getByLabelText('Ville'), { target: { value: 'Paris' } })
    const tag = within(modale).getByLabelText('Tags')
    fireEvent.change(tag, { target: { value: 'syndic' } })
    fireEvent.keyDown(tag, { key: 'Enter' })
    fireEvent.click(within(modale).getByRole('button', { name: 'Créer le client' }))

    await waitFor(() => expect(appels.some((a) => a.methode === 'POST')).toBe(true))
    const envoi = appels.find((a) => a.methode === 'POST')
    expect(envoi?.url).toBe('/api/clients')
    expect(envoi?.corps).toMatchObject({
      nature: 'entreprise',
      nom: 'Nouvelle SARL',
      siret: '12345678901234',
      prenom: null,
      tags: ['syndic'],
      adresses: [
        {
          libelle: 'Principale',
          ligne1: '1 rue Neuve',
          codePostal: '75001',
          ville: 'Paris',
          parDefaut: true,
        },
      ],
    })
  })

  it('archive un client depuis sa fiche avec un motif', async () => {
    monter('/clients/1')
    expect(await screen.findByRole('heading', { name: 'Claire Martin' })).toBeInTheDocument()
    expect(screen.getByText(/3 rue Haute/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Autres actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archiver' }))
    const modale = await screen.findByRole('dialog')
    fireEvent.change(within(modale).getByLabelText(/Motif/), { target: { value: 'Déménagé' } })
    fireEvent.click(within(modale).getByRole('button', { name: 'Archiver le client' }))

    await waitFor(() => expect(appels.some((a) => a.url === '/api/clients/1/archiver')).toBe(true))
    expect(appels.find((a) => a.url.endsWith('/archiver'))?.corps).toEqual({ motif: 'Déménagé' })
    fireEvent.click(screen.getByRole('button', { name: 'Autres actions' }))
    expect(await screen.findByRole('menuitem', { name: 'Restaurer' })).toBeInTheDocument()
    expect(screen.getByText(/3 rue Haute/)).toBeInTheDocument()
  })

  it('conserve le pays d’une adresse étrangère au PUT', async () => {
    const etrangere = { ...FICHE, adresses: [{ ...FICHE.adresses![0]!, pays: 'BE' }] }
    mockApi(() => json(etrangere))
    monter('/clients/1')
    await screen.findByRole('heading', { name: 'Claire Martin' })
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    const modale = await screen.findByRole('dialog')
    expect(within(modale).getByLabelText('Pays')).toHaveValue('BE')
    fireEvent.click(within(modale).getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(appels.some((a) => a.methode === 'PUT')).toBe(true))
    expect(appels.find((a) => a.methode === 'PUT')?.corps).toMatchObject({
      adresses: [{ pays: 'BE' }],
    })
  })

  it('affiche un message propre pour une fiche introuvable', async () => {
    mockApi(() => json({ message: 'Introuvable' }, 404))
    monter('/clients/404')
    expect(await screen.findByText('Client introuvable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux clients' })).toHaveAttribute(
      'href',
      '/clients',
    )
  })

  it('filtre les professionnels avec l’onglet de l’URL', async () => {
    monter('/clients?onglet=professionnels')
    expect(await screen.findByText('Batimex')).toBeInTheDocument()
    expect(screen.queryByText('Claire Martin')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Professionnels' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('liste les devis du client dans l’onglet Historique de la fiche', async () => {
    mockApi(() => json({ ...FICHE, nom: 'Moreau' }))
    monter('/clients/1')
    await screen.findByRole('heading', { name: 'Claire Moreau' })
    fireEvent.click(screen.getByRole('tab', { name: 'Historique' }))
    expect(await screen.findByRole('link', { name: 'Devis DEV-2026-0039' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Facture FAC-2026-0108' })).toBeInTheDocument()
  })

  it('garde la recherche et son focus pendant le rechargement', async () => {
    monter('/clients')
    await screen.findByText('Batimex')
    const champ = screen.getByRole('searchbox')
    champ.focus()
    fireEvent.change(champ, { target: { value: 'bati' } })
    await waitFor(() => expect(appels.some((a) => a.url.includes('recherche=bati'))).toBe(true))
    expect(screen.getByRole('searchbox')).toBe(champ)
    expect(champ).toHaveFocus()
  })
})
