import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PageArticles } from '@/features/articles/PageArticles'
import { apiArticles, apiCategories } from '@/services/articlesApi'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'
import type { Article } from '@shared/articles'

vi.mock('@/services/articlesApi', () => ({
  apiArticles: {
    lister: vi.fn(),
    unites: vi.fn(),
    creer: vi.fn(),
    modifier: vi.fn(),
    supprimer: vi.fn(),
    favori: vi.fn(),
    dupliquer: vi.fn(),
    ordonner: vi.fn(),
  },
  apiCategories: { lister: vi.fn(), creer: vi.fn(), renommer: vi.fn(), supprimer: vi.fn() },
}))

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
  article({ id: '1', nom: 'Pose de carrelage' }),
  article({ id: '2', nom: 'Peinture murale', type: 'produit', unite: 'u', ordre: 2 }),
  article({ id: '3', nom: 'Ancien tarif', actif: false, ordre: 3 }),
]

function monter(url = '/articles', peut = true) {
  const session = { peut: () => peut } as unknown as SessionContextValue
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiArticles.lister).mockResolvedValue(CATALOGUE)
  vi.mocked(apiArticles.unites).mockResolvedValue(['u', 'm²'])
  vi.mocked(apiArticles.creer).mockResolvedValue(article({ id: '9' }))
  vi.mocked(apiArticles.favori).mockResolvedValue(article({ favori: true }))
  vi.mocked(apiCategories.lister).mockResolvedValue([])
})

describe('PageArticles', () => {
  it('affiche la liste active, les compteurs et cache les archivés', async () => {
    monter()
    const ligne = (await screen.findByText('Pose de carrelage')).closest('tr') as HTMLElement
    expect(within(ligne).getByText(/45,00/)).toBeInTheDocument()
    expect(within(ligne).getByText(/10 %/)).toBeInTheDocument()
    expect(screen.getByText('Peinture murale')).toBeInTheDocument()
    expect(screen.queryByText('Ancien tarif')).not.toBeInTheDocument()
    expect(screen.getByText('articles').closest('li')).toHaveTextContent('2 articles')
    expect(screen.queryByText(/utilisés ce mois/)).not.toBeInTheDocument()
  })

  it('montre les archivés via le filtre de statut', async () => {
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: /Filtres/ }))
    fireEvent.click(screen.getByLabelText('Archivés'))
    expect(screen.getByText('Ancien tarif')).toBeInTheDocument()
    expect(screen.queryByText('Pose de carrelage')).not.toBeInTheDocument()
  })

  it('filtre par onglet et par recherche', async () => {
    monter()
    await screen.findByText('Peinture murale')
    fireEvent.click(screen.getByRole('tab', { name: 'Produits' }))
    expect(screen.queryByText('Pose de carrelage')).not.toBeInTheDocument()
    expect(screen.getByText('Peinture murale')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Tous' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'CARRE' } })
    expect(screen.queryByText('Peinture murale')).not.toBeInTheDocument()
    expect(screen.getByText('Pose de carrelage')).toBeInTheDocument()
  })

  it('ouvre le panneau et crée un article via l’API', async () => {
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Nouvel article' }))
    const panneau = await screen.findByRole('dialog')

    fireEvent.click(within(panneau).getByRole('button', { name: 'Enregistrer l’article' }))
    expect(within(panneau).getByText('Donnez un nom à l’article.')).toBeInTheDocument()

    fireEvent.change(within(panneau).getByLabelText('Nom de l’article'), { target: { value: 'Dépose' } })
    fireEvent.change(within(panneau).getByLabelText('Prix de vente HT'), { target: { value: '12,5' } })
    fireEvent.click(within(panneau).getByRole('button', { name: 'Enregistrer l’article' }))

    await waitFor(() => expect(apiArticles.creer).toHaveBeenCalledTimes(1))
    expect(apiArticles.creer).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Dépose', prixUnitaireHt: 12.5, tauxTva: 20, type: 'service', unite: 'u', prixAchatHt: null }),
    )
  })

  it('ouvre le panneau de création avec ?nouveau=1 et calcule la marge', async () => {
    monter('/articles?nouveau=1')
    const panneau = await screen.findByRole('dialog')
    expect(within(panneau).getByText('Nouvel article')).toBeInTheDocument()
    fireEvent.change(within(panneau).getByLabelText('Prix de vente HT'), { target: { value: '100' } })
    fireEvent.change(within(panneau).getByLabelText(/Prix d’achat/), { target: { value: '60' } })
    expect(within(panneau).getByText(/Marge/)).toHaveTextContent(/40,00.*66,67 %/)
  })

  it('bascule le favori par l’API', async () => {
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Favori : Pose de carrelage' }))
    await waitFor(() => expect(apiArticles.favori).toHaveBeenCalledWith('1', true))
  })

  it('archive depuis le menu de ligne', async () => {
    vi.mocked(apiArticles.modifier).mockResolvedValue(article({ actif: false }))
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour Pose de carrelage' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archiver' }))
    await waitFor(() =>
      expect(apiArticles.modifier).toHaveBeenCalledWith('1', expect.objectContaining({ actif: false, nom: 'Pose de carrelage' })),
    )
  })

  it('duplique un article puis ouvre la copie', async () => {
    vi.mocked(apiArticles.dupliquer).mockResolvedValue(article({ id: '10', nom: 'Pose de carrelage (copie)' }))
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour Pose de carrelage' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Dupliquer' }))
    await waitFor(() => expect(apiArticles.dupliquer).toHaveBeenCalledWith('1'))
    const panneau = await screen.findByRole('dialog')
    expect(within(panneau).getByDisplayValue('Pose de carrelage (copie)')).toBeInTheDocument()
  })

  it('supprime après confirmation', async () => {
    vi.mocked(apiArticles.supprimer).mockResolvedValue(undefined)
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour Pose de carrelage' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Supprimer' }))
    expect(apiArticles.supprimer).not.toHaveBeenCalled()
    const dialogue = await screen.findByRole('dialog')
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Supprimer' }))
    await waitFor(() => expect(apiArticles.supprimer).toHaveBeenCalledWith('1'))
    expect(apiArticles.supprimer).toHaveBeenCalledTimes(1)
  })

  it('est en lecture seule sans la permission de gérer', async () => {
    monter('/articles?nouveau=1', false)
    await screen.findByText('Pose de carrelage')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nouvel article' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Importer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Actions pour/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Favori : Pose de carrelage' })).toBeDisabled()
  })

  it('signale un rejet de l’API par un toast', async () => {
    vi.mocked(apiArticles.favori).mockRejectedValue(new Error('Serveur indisponible'))
    monter()
    await screen.findByText('Pose de carrelage')
    fireEvent.click(screen.getByRole('button', { name: 'Favori : Pose de carrelage' }))
    expect(await screen.findByText('Action impossible')).toBeInTheDocument()
    expect(screen.getByText('Serveur indisponible')).toBeInTheDocument()
  })

  it('affiche un état vide avec action de création', async () => {
    vi.mocked(apiArticles.lister).mockResolvedValue([])
    monter()
    expect(await screen.findByText('Votre catalogue est vide')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer un article' })).toBeInTheDocument()
  })

  it('affiche une erreur de chargement avec réessai', async () => {
    vi.mocked(apiArticles.lister).mockRejectedValue(new Error('Hors ligne'))
    monter()
    expect(await screen.findByText('Hors ligne')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })
})
