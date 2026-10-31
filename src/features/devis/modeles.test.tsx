import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/store/ToastProvider'
import { ApercuDevis } from './ApercuDevis'
import { DEVIS_DEMO, MODELES_DEMO, magasinModeles } from './donnees'
import { PageEditeurModele } from './PageEditeurModele'
import { PageModelesDevis } from './PageModelesDevis'

const monter = (url: string) =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/devis/modeles" element={<PageModelesDevis />} />
          <Route path="/devis/modeles/:id" element={<PageEditeurModele />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )

describe('modèles de devis', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
  })

  it('masque la colonne TVA quand elle est désactivée', () => {
    const modele = MODELES_DEMO[0]!
    const { rerender } = render(<ApercuDevis devis={DEVIS_DEMO[0]!} modele={modele} />)
    expect(screen.getByRole('columnheader', { name: 'TVA' })).toBeInTheDocument()
    rerender(
      <ApercuDevis
        devis={DEVIS_DEMO[0]!}
        modele={{ ...modele, afficher: { ...modele.afficher, tvaParLigne: false } }}
      />,
    )
    expect(screen.queryByRole('columnheader', { name: 'TVA' })).not.toBeInTheDocument()
  })

  it('met l’aperçu à jour quand on change la couleur', () => {
    monter('/devis/modeles/m-sobre')
    const feuille = () => document.querySelector<HTMLElement>('.feuille-a4')!
    expect(feuille().style.getPropertyValue('--accent')).toBe('#034a78')
    fireEvent.click(screen.getByRole('radio', { name: 'Bordeaux' }))
    expect(feuille().style.getPropertyValue('--accent')).toBe('#8a1c2b')
  })

  it('enregistre le modèle modifié', () => {
    monter('/devis/modeles/m-classique')
    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: 'Élégant' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(magasinModeles.lire().find((m) => m.id === 'm-classique')?.nom).toBe('Élégant')
  })

  it('définit un modèle par défaut et refuse de supprimer le modèle par défaut', () => {
    monter('/devis/modeles')
    const ouvrirMenu = (nom: string) =>
      fireEvent.click(screen.getByRole('button', { name: `Actions : ${nom}` }))

    ouvrirMenu('Sobre')
    expect(screen.getByRole('menuitem', { name: 'Supprimer' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })

    ouvrirMenu('Bandeau turquoise')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Définir par défaut' }))
    const defauts = magasinModeles.lire().filter((m) => m.parDefaut)
    expect(defauts.map((m) => m.id)).toEqual(['m-bandeau'])
    expect(within(screen.getByRole('list')).getAllByText('Par défaut')).toHaveLength(1)
  })
})
