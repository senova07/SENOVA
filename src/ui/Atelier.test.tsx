import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Atelier, BarreApercu, SectionAtelier } from '@/ui/Atelier'
import { allerASection, echelleAjustee, zoomMoins, zoomPlus, type ModeZoom } from '@/ui/AtelierFonctions'

function Zoom() {
  const [zoom, setZoom] = useState<ModeZoom>(1)
  const echelle = zoom === 'ajuster' ? 0.8 : zoom
  return <BarreApercu zoom={zoom} echelle={echelle} onZoom={setZoom} />
}

describe('SectionAtelier', () => {
  it('se replie et se déplie avec aria-expanded / aria-controls', () => {
    render(
      <SectionAtelier id="s-client" numero={1} titre="Client" ouverteParDefaut>
        <p>Contenu</p>
      </SectionAtelier>,
    )
    const bouton = screen.getByRole('button', { name: /Client/ })
    expect(bouton).toHaveAttribute('aria-expanded', 'true')
    expect(bouton).toHaveAttribute('aria-controls', 's-client-corps')
    expect(screen.getByText('Contenu')).toBeVisible()
    fireEvent.click(bouton)
    expect(bouton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Contenu')).not.toBeVisible()
    fireEvent.click(bouton)
    expect(bouton).toHaveAttribute('aria-expanded', 'true')
  })

  it('allerASection ouvre une section fermée', () => {
    window.HTMLElement.prototype.scrollIntoView = () => {}
    render(
      <SectionAtelier id="s-infos" numero={2} titre="Informations">
        <input aria-label="Objet" />
      </SectionAtelier>,
    )
    const bouton = screen.getByRole('button', { name: /Informations/ })
    expect(bouton).toHaveAttribute('aria-expanded', 'false')
    act(() => allerASection('s-infos'))
    expect(bouton).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Atelier', () => {
  it('propose les onglets Modification / Aperçu', () => {
    render(<Atelier formulaire={<p>F</p>} apercu={<p>A</p>} pied={<p>P</p>} />)
    const modif = screen.getByRole('tab', { name: 'Modification' })
    expect(modif).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Aperçu' }))
    expect(screen.getByRole('tab', { name: 'Aperçu' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('zoom', () => {
  it('plus et moins restent dans les bornes 50 % – 125 %', () => {
    render(<Zoom />)
    const plus = screen.getByRole('button', { name: 'Zoomer' })
    fireEvent.click(plus)
    expect(screen.getByText('125 %')).toBeInTheDocument()
    fireEvent.click(plus)
    expect(screen.getByText('125 %')).toBeInTheDocument()
    const moins = screen.getByRole('button', { name: 'Dézoomer' })
    for (let i = 0; i < 8; i++) fireEvent.click(moins)
    expect(screen.getByText('50 %')).toBeInTheDocument()
  })

  it('zoomPlus / zoomMoins passent au palier voisin', () => {
    expect(zoomPlus(0.72)).toBe(0.8)
    expect(zoomMoins(0.72)).toBe(0.65)
    expect(zoomPlus(1.25)).toBe(1.25)
    expect(zoomMoins(0.5)).toBe(0.5)
  })

  it('echelleAjustee retire les marges et borne entre 30 % et 110 %', () => {
    expect(echelleAjustee(794 + 48)).toBe(1)
    expect(echelleAjustee(100)).toBe(0.3)
    expect(echelleAjustee(3000)).toBe(1.1)
  })
})
