import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PageArticles } from '@/features/articles/PageArticles'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'
import type { Article } from '@shared/articles'

const article = (o: Partial<Article>): Article => ({
  id: '1',
  reference: null,
  nom: 'Pose de carrelage',
  description: '',
  type: 'service',
  unite: 'm²',
  prixUnitaireHt: 45,
  tauxTva: 10,
  prixAchatHt: null,
  categorieId: null,
  favori: false,
  actif: true,
  ordre: 1,
  ...o,
})

const CATALOGUE = [
  article({ id: '1', nom: 'Pose de carrelage', prixUnitaireHt: 45, prixAchatHt: 30 }),
  article({ id: '2', nom: 'Peinture murale', type: 'produit', unite: 'u', ordre: 2 }),
]

let appels: { methode: string; url: string; corps?: unknown }[]

function mockApi(articles: Article[] = CATALOGUE) {
  appels = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const methode = init?.method ?? 'GET'
      appels.push({ methode, url, corps: init?.body ? JSON.parse(String(init.body)) : undefined })
      const json = (donnees: unknown, status = 200) =>
        new Response(JSON.stringify(donnees), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      if (methode === 'GET' && url.startsWith('/api/articles/unites')) return json(['u', 'm²'])
      if (methode === 'GET' && url.startsWith('/api/articles')) return json(articles)
      if (url.startsWith('/api/categories-articles')) return json([])
      return json(article({ id: '9' }), 201)
    }),
  )
}

function monter(url = '/articles') {
  const session = { peut: () => true } as unknown as SessionContextValue
  return render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <MemoryRouter initialEntries={[url]}>
          <PageArticles />
        </MemoryRouter>
      </SessionContext.Provider>
    </ToastProvider>,
  )
}

describe('PageArticles', () => {
  beforeEach(() => mockApi())
  afterEach(() => vi.unstubAllGlobals())

  it('affiche la liste avec prix, TVA et, sur demande, la marge', async () => {
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Colonnes' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Marge' }))
    const ligne = screen.getByText('Pose de carrelage').closest('tr') as HTMLElement
    expect(within(ligne).getByText(/45,00/)).toBeInTheDocument()
    expect(within(ligne).getByText(/10 %/)).toBeInTheDocument()
    expect(within(ligne).getByText(/15,00.*50 %/)).toBeInTheDocument()
    expect(screen.getByText('Peinture murale')).toBeInTheDocument()
  })

  it('filtre par recherche et par onglet', async () => {
    monter()
    await screen.findByText('Peinture murale')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'carre' } })
    expect(screen.queryByText('Peinture murale')).not.toBeInTheDocument()
    expect(screen.getByText('Pose de carrelage')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Produits' }))
    expect(screen.queryByText('Pose de carrelage')).not.toBeInTheDocument()
    expect(screen.getByText('Peinture murale')).toBeInTheDocument()
  })

  it('crée un article via la modale ouverte par ?nouveau=1', async () => {
    monter('/articles?nouveau=1')
    const modale = await screen.findByRole('dialog')

    fireEvent.click(within(modale).getByRole('button', { name: 'Créer l’article' }))
    expect(within(modale).getByText('Donnez un nom à l’article.')).toBeInTheDocument()

    fireEvent.change(within(modale).getByLabelText('Nom'), { target: { value: 'Dépose' } })
    fireEvent.change(within(modale).getByLabelText('Prix HT (€)'), { target: { value: '12,5' } })
    fireEvent.click(within(modale).getByRole('button', { name: 'Créer l’article' }))

    await waitFor(() => expect(appels.some((a) => a.methode === 'POST')).toBe(true))
    const envoi = appels.find((a) => a.methode === 'POST')
    expect(envoi?.url).toBe('/api/articles')
    expect(envoi?.corps).toMatchObject({
      nom: 'Dépose',
      prixUnitaireHt: 12.5,
      tauxTva: 20,
      type: 'service',
      unite: 'u',
      prixAchatHt: null,
    })
  })

  it('calcule la marge en direct', async () => {
    monter('/articles?nouveau=1')
    const modale = await screen.findByRole('dialog')
    fireEvent.change(within(modale).getByLabelText('Prix HT (€)'), { target: { value: '100' } })
    fireEvent.change(within(modale).getByLabelText(/Prix d’achat/), { target: { value: '60' } })
    expect(within(modale).getByText(/Marge/)).toHaveTextContent(/40,00.*66,67 %/)
  })

  it('trie, sélectionne et pagine', async () => {
    mockApi(Array.from({ length: 14 }, (_, i) => article({ id: String(i + 1), nom: `Article ${i + 1}`, prixUnitaireHt: i + 1, ordre: i })))
    monter()
    await screen.findByText('Article 1')
    expect(screen.getByText('Affichage 1 – 12 sur 14')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }))
    expect(screen.getByText('Article 14')).toBeInTheDocument()
    expect(screen.queryByText('Article 1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Prix HT/ }))
    fireEvent.click(screen.getByRole('button', { name: /Prix HT/ }))
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Article 14')

    fireEvent.click(screen.getByLabelText('Tout sélectionner sur la page'))
    expect(screen.getByText('12 articles sélectionnés')).toBeInTheDocument()
  })

  it('affiche un état vide avec action de création', async () => {
    mockApi([])
    monter()
    expect(await screen.findByText('Votre catalogue est vide')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Créer un article' }).length).toBeGreaterThan(0)
  })
})
