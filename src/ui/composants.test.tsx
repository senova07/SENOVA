import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PanneauLateral } from '@/ui/PanneauLateral'
import { ControleSegmente } from '@/ui/ControleSegmente'
import { Dialogue } from '@/ui/Dialogue'
import { Interrupteur } from '@/ui/Interrupteur'
import { ElementMenu, Menu } from '@/ui/Menu'

describe('Menu', () => {
  const rendre = () =>
    render(
      <Menu
        libelle="Actions"
        declencheur={({ ouvert, basculer }) => (
          <button type="button" aria-haspopup="menu" aria-expanded={ouvert} onClick={basculer}>
            Ouvrir
          </button>
        )}
      >
        {() => (
          <>
            <ElementMenu>Modifier</ElementMenu>
            <ElementMenu>Archiver</ElementMenu>
          </>
        )}
      </Menu>,
    )

  it('ouvre sur le premier élément, les flèches circulent, Échap ferme et rend le focus', () => {
    rendre()
    const declencheur = screen.getByRole('button', { name: 'Ouvrir' })
    declencheur.focus()
    fireEvent.click(declencheur)

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument()
    expect(declencheur).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Modifier' })).toHaveFocus()

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: 'Archiver' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: 'Modifier' })).toHaveFocus()

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(declencheur).toHaveFocus()
  })

  it('se ferme au clic en dehors', () => {
    rendre()
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('ControleSegmente', () => {
  function Exemple() {
    const [valeur, setValeur] = useState<'s' | 'm' | 'l'>('s')
    return (
      <ControleSegmente<'s' | 'm' | 'l'>
        libelle="Taille"
        valeur={valeur}
        onChoisir={setValeur}
        options={[
          { id: 's', libelle: 'Petit' },
          { id: 'm', libelle: 'Moyen' },
          { id: 'l', libelle: 'Grand' },
        ]}
      />
    )
  }

  it('est un radiogroup à une seule tabulation, les flèches changent le choix', () => {
    render(<Exemple />)
    expect(screen.getByRole('radiogroup', { name: 'Taille' })).toBeInTheDocument()
    const petit = screen.getByRole('radio', { name: 'Petit' })
    expect(petit).toHaveAttribute('aria-checked', 'true')
    expect(petit).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Moyen' })).toHaveAttribute('tabindex', '-1')

    petit.focus()
    fireEvent.keyDown(petit, { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: 'Moyen' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Moyen' })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Moyen' }), { key: 'ArrowLeft' })
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Petit' }), { key: 'ArrowLeft' })
    expect(screen.getByRole('radio', { name: 'Grand' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('Interrupteur', () => {
  it('expose role switch, nommé par son libellé, et bascule', () => {
    function Exemple() {
      const [actif, setActif] = useState(false)
      return <Interrupteur libelle="Favori" checked={actif} onChange={(ev) => setActif(ev.target.checked)} />
    }
    render(<Exemple />)
    const interrupteur = screen.getByRole('switch', { name: 'Favori' })
    expect(interrupteur).not.toBeChecked()
    fireEvent.click(interrupteur)
    expect(interrupteur).toBeChecked()
  })
})

describe('Dialogue', () => {
  function Exemple() {
    const [ouvert, setOuvert] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOuvert(true)}>
          Ouvrir
        </button>
        <Dialogue ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Nouveau client">
          <input aria-label="Nom" />
        </Dialogue>
      </>
    )
  }

  it('est modal, focus sur le premier champ, Échap ferme et rend le focus au déclencheur', () => {
    render(<Exemple />)
    const declencheur = screen.getByRole('button', { name: 'Ouvrir' })
    declencheur.focus()
    fireEvent.click(declencheur)

    const dialogue = screen.getByRole('dialog', { name: 'Nouveau client' })
    expect(dialogue).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Nom')).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(declencheur).toHaveFocus()
  })

  it('garde le focus piégé avec Tab', () => {
    render(<Exemple />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
    screen.getByLabelText('Nom').focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
  })
})

describe('calques empilés', () => {
  it('Échap ferme seulement le calque du dessus, puis l’autre ; le défilement est rendu', () => {
    document.body.style.overflow = 'scroll'
    function Exemple() {
      const [panneau, setPanneau] = useState(true)
      const [dialogue, setDialogue] = useState(false)
      return (
        <>
          <PanneauLateral ouvert={panneau} onFermer={() => setPanneau(false)} titre="Panneau">
            <button type="button" onClick={() => setDialogue(true)}>
              Ouvrir le dialogue
            </button>
          </PanneauLateral>
          <Dialogue ouvert={dialogue} onFermer={() => setDialogue(false)} titre="Dialogue">
            <input aria-label="Nom" />
          </Dialogue>
        </>
      )
    }
    render(<Exemple />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le dialogue' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(2)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog', { name: 'Panneau' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('scroll')
    document.body.style.overflow = ''
  })

  it('Échap dans un menu ouvert ferme le menu, pas le dialogue', () => {
    render(
      <Dialogue ouvert onFermer={() => undefined} titre="Dialogue">
        <Menu
          libelle="Actions"
          declencheur={({ ouvert, basculer }) => (
            <button type="button" aria-expanded={ouvert} onClick={basculer}>
              Ouvrir le menu
            </button>
          )}
        >
          {() => <ElementMenu>Modifier</ElementMenu>}
        </Menu>
      </Dialogue>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
