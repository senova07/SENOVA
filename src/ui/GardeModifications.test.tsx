import { fireEvent, render, screen } from '@testing-library/react'
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { GardeModifications } from './GardeModifications'

function monter(actif: boolean) {
  const routeur = createMemoryRouter(
    [
      { path: '/', element: <><Link to="/ailleurs">Partir</Link><GardeModifications actif={actif} message="2 lignes non enregistrées." /></> },
      { path: '/ailleurs', element: <p>Ailleurs</p> },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={routeur} />)
}

test('demande confirmation avant de quitter avec des modifications', async () => {
  monter(true)
  fireEvent.click(screen.getByRole('link', { name: 'Partir' }))
  expect(await screen.findByRole('dialog', { name: 'Quitter sans enregistrer ?' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Rester' }))
  expect(screen.queryByText('Ailleurs')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('link', { name: 'Partir' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Quitter sans enregistrer' }))
  expect(await screen.findByText('Ailleurs')).toBeInTheDocument()
})

test('laisse partir sans modifications', async () => {
  monter(false)
  fireEvent.click(screen.getByRole('link', { name: 'Partir' }))
  expect(await screen.findByText('Ailleurs')).toBeInTheDocument()
})
