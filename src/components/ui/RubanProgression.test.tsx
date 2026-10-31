import { render, screen } from '@testing-library/react'
import { RubanProgression } from '@/components/ui/RubanProgression'

describe('RubanProgression', () => {
  it('marque l\'étape courante et les étapes terminées', () => {
    render(<RubanProgression courante="prestation" />)
    const etapes = screen.getAllByRole('listitem')
    expect(etapes).toHaveLength(5)
    expect(screen.getByText(/Prestation/).closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText(/Client/)).toHaveTextContent('(terminée)')
    expect(screen.getByText(/Facture/)).not.toHaveTextContent('terminée')
  })
})
