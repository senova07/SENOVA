import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PageImportArticles } from '@/features/articles/import/PageImportArticles'
import { ErreurApi } from '@/services/http'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'

const { creer, categories } = vi.hoisted(() => ({ creer: vi.fn(), categories: vi.fn() }))
vi.mock('@/services/articlesApi', () => ({
  apiArticles: { creer },
  apiCategories: { lister: categories },
}))

function monter(peut = true) {
  const session = { peut: () => peut } as unknown as SessionContextValue
  return render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <RouterProvider router={createMemoryRouter([{ path: '/', element: <PageImportArticles /> }])} />
      </SessionContext.Provider>
    </ToastProvider>,
  )
}

const COLLAGE = ['Désignation\tType\tPU HT', 'Pose carrelage\tservice\t45,00', 'Peinture\tproduit\tabc', 'Vis\tproduit\t1,20 €'].join('\n')

function collerDansPremiereCellule() {
  const champ = screen.getByLabelText('Nom de l\'article, ligne 1')
  fireEvent.paste(champ, { clipboardData: { getData: () => COLLAGE } })
}

describe('PageImportArticles', () => {
  beforeEach(() => {
    sessionStorage.clear()
    creer.mockReset()
    categories.mockReset()
    categories.mockResolvedValue([])
  })

  it('refuse l’accès sans la permission', () => {
    monter(false)
    expect(screen.getByText('Accès non autorisé')).toBeInTheDocument()
  })

  it('colle 3 lignes dont 1 invalide, enregistre les 2 valides et garde la ligne en échec de validation', async () => {
    creer.mockResolvedValue({ id: '1' })
    monter()
    collerDansPremiereCellule()

    await waitFor(() => expect(screen.getByLabelText('Nom de l\'article, ligne 3')).toHaveValue('Vis'))
    expect(screen.getByRole('button', { name: /Enregistrer 2 articles/ })).toBeEnabled()
    expect(screen.getByLabelText('Prix HT, ligne 2')).toHaveAttribute('aria-invalid', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer 2 articles/ }))

    await waitFor(() => expect(screen.getByRole('status', { name: /Récapitulatif/ })).toBeInTheDocument())
    expect(creer).toHaveBeenCalledTimes(2)
    expect(creer.mock.calls[0]?.[0]).toMatchObject({ nom: 'Pose carrelage', type: 'service', prixUnitaireHt: 45 })
    expect(within(screen.getByRole('status', { name: /Récapitulatif/ })).getByText(/2 articles créés, 0 en échec/)).toBeInTheDocument()
    // Les lignes créées sont retirées ; la ligne invalide reste dans la grille.
    expect(screen.getByDisplayValue('Peinture')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Vis')).not.toBeInTheDocument()
  })

  it('affiche les échecs de l’API par ligne et garde ces lignes', async () => {
    creer.mockResolvedValueOnce({ id: '1' }).mockRejectedValueOnce(new ErreurApi(422, 'Référence déjà utilisée'))
    monter()
    fireEvent.paste(screen.getByLabelText('Nom de l\'article, ligne 1'), { clipboardData: { getData: () => 'Désignation\tType\tPU HT\nA\tservice\t1\nB\tservice\t2' } })
    await waitFor(() => expect(screen.getByLabelText('Nom de l\'article, ligne 2')).toHaveValue('B'))

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer 2 articles/ }))
    const recap = await screen.findByRole('status', { name: /Récapitulatif/ })
    expect(recap).toHaveTextContent('1 article créé, 1 en échec')
    expect(recap).toHaveTextContent('Référence déjà utilisée')
    expect(screen.getByDisplayValue('B')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('A')).not.toBeInTheDocument()
  })

  it('restaure le brouillon après un rechargement et permet de le vider', async () => {
    const l = { id: 'x1', nom: 'Brouillon', type: 'service', reference: '', categorie: '', unite: 'u', prix: '5,00', tva: '20', achat: '', favori: false }
    sessionStorage.setItem('senova.articles-import.brouillon.v1', JSON.stringify([l]))
    monter()
    expect(screen.getByText(/Brouillon restauré : 1 ligne/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Brouillon')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Vider' }))
    expect(screen.queryByDisplayValue('Brouillon')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('senova.articles-import.brouillon.v1')).toBeNull()
  })

  it('écrit le brouillon après un changement', async () => {
    monter()
    fireEvent.change(screen.getByLabelText("Nom de l'article, ligne 1"), { target: { value: 'Joint' } })
    await waitFor(() => expect(sessionStorage.getItem('senova.articles-import.brouillon.v1')).toContain('Joint'), { timeout: 2000 })
  })

  it('refuse un fichier Excel avec un message honnête', () => {
    monter()
    fireEvent.click(screen.getByRole('button', { name: /Importer un fichier/ }))
    const champ = screen.getByLabelText('Fichier à importer')
    fireEvent.change(champ, { target: { files: [new File(['x'], 'catalogue.xlsx')] } })
    expect(screen.getByRole('alert')).toHaveTextContent('Les fichiers Excel arrivent bientôt')
  })
})
