import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ChampRecherche } from '@/ui/ChampRecherche'
import { Compteurs } from '@/ui/Compteurs'
import { ElementMenu, MenuLigne } from '@/ui/Menu'

describe('Compteurs', () => {
  it('rend une liste nommée avec valeur, libellé, sous-texte, lien et ton', () => {
    render(
      <MemoryRouter>
        <Compteurs
          libelle="Chiffres du jour"
          compteurs={[
            { libelle: 'articles', valeur: 12 },
            { libelle: 'Reste à encaisser', valeur: '1 200 €', sous: 'dont 300 € en retard', ton: 'danger', lien: '/factures' },
          ]}
          actions={<button type="button">Filtres</button>}
        />
      </MemoryRouter>,
    )
    const liste = screen.getByRole('list', { name: 'Chiffres du jour' })
    expect(within(liste).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('articles').closest('li')).toHaveTextContent('12 articles')
    const lien = screen.getByRole('link', { name: /Reste à encaisser/ })
    expect(lien).toHaveAttribute('href', '/factures')
    expect(lien).toHaveTextContent('dont 300 € en retard')
    expect(lien.closest('li')).toHaveClass('compteurs__item--danger')
    expect(screen.getByRole('button', { name: 'Filtres' })).toBeInTheDocument()
  })

  it('n’affiche pas de liste vide', () => {
    render(<Compteurs compteurs={[]} actions={<span>Outils</span>} />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('Outils')).toBeInTheDocument()
  })
})

describe('ChampRecherche', () => {
  function Exemple({ onChange }: { onChange(v: string): void }) {
    const [valeur, setValeur] = useState('bati')
    return (
      <ChampRecherche
        valeur={valeur}
        onChange={(v) => {
          setValeur(v)
          onChange(v)
        }}
        libelle="Rechercher un client"
        placeholder="Nom, e-mail…"
      />
    )
  }

  it('Échap vide le champ rempli, puis ne fait plus rien', () => {
    const onChange = vi.fn()
    render(<Exemple onChange={onChange} />)
    const champ = screen.getByRole('searchbox', { name: 'Rechercher un client' })
    expect(champ).toHaveValue('bati')

    fireEvent.keyDown(champ, { key: 'Escape' })
    expect(champ).toHaveValue('')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('')

    fireEvent.keyDown(champ, { key: 'Escape' })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('transmet la saisie', () => {
    const onChange = vi.fn()
    render(<Exemple onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dupont' } })
    expect(onChange).toHaveBeenCalledWith('dupont')
  })
})

describe('MenuLigne', () => {
  it('ouvre le menu, exécute le choix, ferme et rend le focus au bouton ⋮', () => {
    const modifier = vi.fn()
    render(
      <MenuLigne libelle="Actions : DEV-001">
        {(fermer) => (
          <ElementMenu
            onClick={() => {
              fermer()
              modifier()
            }}
          >
            Modifier
          </ElementMenu>
        )}
      </MenuLigne>,
    )
    const bouton = screen.getByRole('button', { name: 'Actions : DEV-001' })
    expect(bouton).toHaveAttribute('aria-haspopup', 'menu')
    expect(bouton).toHaveAttribute('aria-expanded', 'false')
    bouton.focus()

    fireEvent.click(bouton)
    expect(bouton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Actions : DEV-001' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Modifier' }))
    expect(modifier).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(bouton).toHaveFocus()
  })

  it('s’ouvre vers le haut pour les dernières lignes', () => {
    const { container } = render(
      <MenuLigne libelle="Actions" versLeHaut>
        {() => <ElementMenu>Ouvrir</ElementMenu>}
      </MenuLigne>,
    )
    expect(container.firstElementChild).toHaveClass('menu-ligne--haut')
  })
})
