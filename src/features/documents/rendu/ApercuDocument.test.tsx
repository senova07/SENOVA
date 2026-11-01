import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { formaterEuro, formaterTaux } from '../../../lib/format'
import { ApercuDocument } from './ApercuDocument'
import { CHARTE_PAR_DEFAUT, MODELES_PAGE, STYLES_TABLEAU, variablesCharte } from './charte'
import { DOCUMENT_EXEMPLE } from './exemple'
import type { ChartePage } from './types'

// Testing Library normalise les espaces insécables du texte affiché : on fait de même pour la valeur attendue.
const euro = (n: number) => formaterEuro(n).replace(/\s/g, ' ')
const charte = (surcharge: Partial<ChartePage> = {}): ChartePage => ({ ...CHARTE_PAR_DEFAUT, ...surcharge })

describe('ApercuDocument', () => {
  const combinaisons = [
    ...MODELES_PAGE.flatMap((m) => [[m.id, 'standard'], [m.id, 'cartes']] as const),
    ...STYLES_TABLEAU.map((s) => ['classique-pro', s.id] as const),
  ]
  it.each(combinaisons)(
    'rend le modèle %s avec le style %s',
    (modele, styleTableau) => {
      render(<ApercuDocument document={DOCUMENT_EXEMPLE} charte={charte({ modele, styleTableau })} />)
      expect(screen.getAllByText(/DEV-2026-0042/).length).toBeGreaterThan(0)
      expect(screen.getByText(euro(DOCUMENT_EXEMPLE.totaux.totalTtc))).toBeInTheDocument()
      expect(screen.getByText('Pose lavabo')).toBeInTheDocument()
    },
  )

  it('affiche les TVA par taux, formatées', () => {
    render(<ApercuDocument document={DOCUMENT_EXEMPLE} charte={charte()} />)
    expect(screen.getByText(`TVA ${formaterTaux(10)}`)).toBeInTheDocument()
    expect(screen.getByText(`TVA ${formaterTaux(20)}`)).toBeInTheDocument()
  })

  it('affiche un avoir en négatif', () => {
    render(<ApercuDocument document={{ ...DOCUMENT_EXEMPLE, type: 'avoir' }} charte={charte()} />)
    expect(screen.getByText(euro(-DOCUMENT_EXEMPLE.totaux.totalTtc))).toBeInTheDocument()
  })

  it('reste statique sans onCibler', () => {
    render(<ApercuDocument document={DOCUMENT_EXEMPLE} charte={charte()} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('appelle onCibler avec la zone, à la souris et au clavier', () => {
    const onCibler = vi.fn()
    render(<ApercuDocument document={DOCUMENT_EXEMPLE} charte={charte()} onCibler={onCibler} />)
    const client = screen.getByRole('button', { name: 'Modifier le client' })
    fireEvent.click(client)
    expect(onCibler).toHaveBeenLastCalledWith('client')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Modifier les lignes' }), { key: 'Enter' })
    expect(onCibler).toHaveBeenLastCalledWith('lignes')
  })

  it('désactive les zones en miniature', () => {
    render(<ApercuDocument document={DOCUMENT_EXEMPLE} charte={charte()} onCibler={vi.fn()} miniature />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('variablesCharte', () => {
  it('mélange les teintes au blanc et choisit un texte lisible', () => {
    const v = variablesCharte(charte({ couleurPrincipale: '#000000', couleurAccent: '#FFFFFF' }))
    expect(v['--doc-p']).toBe('#000000')
    expect(v['--doc-p-sur']).toBe('#FFFFFF')
    expect(v['--doc-a-sur']).toBe('#18253A')
    expect(v['--doc-p-doux']).toBe('#F0F0F0')
  })
})
