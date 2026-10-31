import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/store/ToastProvider'
import { PageEspaceDevis } from './PageEspaceDevis'
import { DEVIS_DEMO, magasinDevis, type Devis, type LigneDevis } from './donnees'

const article = (extra: Partial<LigneDevis> = {}): LigneDevis => ({
  id: Math.random().toString(36).slice(2),
  genre: 'article',
  designation: 'Prestation',
  quantite: 1,
  unite: 'u',
  prixUnitaireHt: 100,
  tauxTva: 20,
  remisePourcent: 0,
  ...extra,
})

function monter(id: string, lignes?: LigneDevis[]) {
  if (lignes) {
    magasinDevis.enregistrer({
      ...DEVIS_DEMO[0]!,
      id,
      lignes,
      statut: 'brouillon',
      remise: { mode: 'pourcent', valeur: 0 },
    } satisfies Devis)
  }
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/devis/${id}`]}>
        <Routes>
          <Route path="/devis/:id" element={<PageEspaceDevis />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('PageEspaceDevis', () => {
  // Le catalogue est une vraie API : ici elle échoue, la ligne libre doit rester possible.
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 500 })),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('ajoute une ligne libre et recalcule le TTC', () => {
    monter('t-libre', [])
    const recherche = screen.getByRole('combobox', { name: /ajouter un article/i })
    fireEvent.change(recherche, { target: { value: 'Fourniture' } })
    fireEvent.keyDown(recherche, { key: 'Enter' })

    expect(screen.getByLabelText('Désignation, ligne 1')).toHaveValue('Fourniture')
    fireEvent.change(screen.getByLabelText('Quantité, ligne 1'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Prix unitaire HT, ligne 1'), {
      target: { value: '100,50' },
    })
    expect(screen.getByTestId('total-ttc')).toHaveTextContent('241,20')
  })

  it('garde une remise en euros fixe quand les lignes changent', () => {
    monter('t-remise', [article()])
    fireEvent.click(screen.getByRole('button', { name: '€' }))
    fireEvent.change(screen.getByLabelText('Remise globale en euros'), { target: { value: '10' } })
    expect(screen.getByTestId('remise-montant')).toHaveTextContent('10,00')

    fireEvent.change(screen.getByLabelText('Quantité, ligne 1'), { target: { value: '3' } })
    expect(screen.getByTestId('remise-montant')).toHaveTextContent('10,00')
    // 300 − 10 = 290 HT, TVA 20 % = 58, TTC 348
    expect(screen.getByTestId('total-ttc')).toHaveTextContent('348,00')
  })

  it('affiche le sous-total d’une section', () => {
    monter('d1')
    const sousTotaux = screen.getAllByTitle('Sous-total de la section')
    // 180 + 6 × 52 = 492
    expect(sousTotaux[0]).toHaveTextContent('492,00')
    expect(sousTotaux).toHaveLength(2)
  })

  it('passe en lecture seule quand le devis est accepté', () => {
    monter('d3')
    expect(screen.getByRole('note')).toHaveTextContent('accepté')
    expect(screen.getByRole('button', { name: 'Dupliquer pour modifier' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du client')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
  })

  it('propose un retour quand le devis est inconnu', () => {
    monter('inconnu')
    expect(screen.getByText('Devis introuvable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux devis' })).toHaveAttribute('href', '/devis')
  })
})
