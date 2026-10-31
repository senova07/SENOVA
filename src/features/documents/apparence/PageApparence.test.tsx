import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { ToastProvider } from '@/store/ToastProvider'
import { apiCharte, apiReglagesDocuments, REGLAGES_PAR_DEFAUT } from '../api'
import { CHARTE_PAR_DEFAUT } from '../rendu'
import { PageApparence } from './PageApparence'

const session: SessionContextValue = {
  etat: 'connecte',
  session: {
    utilisateur: { id: 'u1', email: 'a@b.fr', nomComplet: 'Alice Durand' },
    organisation: {
      id: 'o1', nom: 'Plomberie Durand', formeJuridique: 'SARL', siret: '81234567800021', tvaIntracom: 'FR32812345678',
      siren: '812345678', adresse: '3 rue Haute', codePostal: '69001', ville: 'Lyon', pays: 'FR', email: 'contact@durand.fr', telephone: '0400000000',
    },
    organisations: [],
    permissions: [],
  },
  peut: () => true,
  seConnecter: async () => undefined,
  sInscrire: async () => undefined,
  seDeconnecter: async () => undefined,
  changerOrganisation: async () => undefined,
}

function monter() {
  const routeur = createMemoryRouter([
    { path: '/', element: <PageApparence /> },
    { path: '/autre', element: <p>Autre page</p> },
  ])
  const rendu = render(
    <ToastProvider>
      <SessionContext.Provider value={session}>
        <RouterProvider router={routeur} />
      </SessionContext.Provider>
    </ToastProvider>,
  )
  return { ...rendu, routeur }
}

const modele = (nom: RegExp) => screen.getByRole('radio', { name: nom })
const ouvrir = (id: string) => fireEvent.click(document.querySelector<HTMLElement>(`#${id} .section-atelier__tete`)!)
const statut = () => document.querySelector('.pied-atelier__statut')

describe('PageApparence', () => {
  beforeEach(() => {
    // jsdom n'a pas de canvas : la roue se dessine sans lui.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(async () => {
    vi.restoreAllMocks()
    await apiCharte.appliquer(CHARTE_PAR_DEFAUT)
    await apiReglagesDocuments.appliquer(REGLAGES_PAR_DEFAUT)
  })

  it('affiche la vraie organisation sur l’aperçu et prérempli les mentions', () => {
    monter()
    expect(screen.getAllByText('Plomberie Durand').length).toBeGreaterThan(0)
    ouvrir('apparence-mentions')
    expect(screen.getByLabelText('SIRET')).toHaveValue('81234567800021')
    expect(screen.getByLabelText('IBAN')).toHaveValue('')
  })

  it('choisir un modèle met à jour l’aperçu, Annuler revient en arrière', () => {
    monter()
    const annuler = screen.getByRole('button', { name: /Annuler la dernière modification/ })
    expect(annuler).toBeDisabled()
    expect(document.querySelector('.atelier__apercu .doc-page')).toHaveAttribute('data-modele', 'classique-pro')

    ouvrir('apparence-modele')
    fireEvent.click(modele(/^Épuré premium/))
    expect(modele(/^Épuré premium/)).toBeChecked()
    expect(document.querySelector('.atelier__apercu .doc-page')).toHaveAttribute('data-modele', 'epure')
    expect(statut()).toHaveTextContent('Modifications non appliquées')

    fireEvent.click(annuler)
    expect(document.querySelector('.atelier__apercu .doc-page')).toHaveAttribute('data-modele', 'classique-pro')
    expect(annuler).toBeDisabled()
    expect(statut()).toHaveTextContent('Appliquée pour cette session')
  })

  it('Appliquer appelle apiCharte.appliquer et le dit honnêtement', async () => {
    const appliquer = vi.spyOn(apiCharte, 'appliquer')
    monter()
    const bouton = screen.getByRole('button', { name: /Appliquer à tous mes documents/ })
    expect(bouton).toBeDisabled()
    ouvrir('apparence-police')
    fireEvent.click(screen.getByRole('radio', { name: 'Classique' }))
    await act(async () => fireEvent.click(bouton))
    expect(appliquer).toHaveBeenCalledWith(expect.objectContaining({ police: 'serif' }))
    await waitFor(() => expect(screen.getByText(/pas encore sauvegardée sur le serveur/)).toBeInTheDocument())
  })

  it('Revenir au modèle par défaut demande confirmation', () => {
    monter()
    ouvrir('apparence-police')
    fireEvent.click(screen.getByRole('radio', { name: 'Classique' }))
    fireEvent.click(screen.getByRole('button', { name: /Revenir au modèle par défaut/ }))
    const dialogue = screen.getByRole('dialog', { name: /Revenir au modèle par défaut/ })
    expect(screen.getByRole('radio', { name: 'Classique' })).toBeChecked()
    fireEvent.click(within(dialogue).getByRole('button', { name: 'Garder mon apparence' }))
    expect(screen.queryByRole('dialog', { name: /Revenir au modèle/ })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Classique' })).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: /Revenir au modèle par défaut/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Revenir au modèle par défaut' }))
    expect(screen.getByRole('radio', { name: 'Moderne' })).toBeChecked()
  })

  it('un clic sur une zone de l’aperçu ouvre la section correspondante', async () => {
    monter()
    const section = document.getElementById('apparence-textes')!
    expect(section.querySelector('.section-atelier__tete')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(within(document.querySelector<HTMLElement>('.atelier__apercu')!).getByRole('button', { name: 'Modifier les conditions' }))
    await waitFor(() => expect(section.querySelector('.section-atelier__tete')).toHaveAttribute('aria-expanded', 'true'))
  })

  it('un élément manquant de la progression saute à sa section', async () => {
    monter()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '57')
    fireEvent.click(screen.getByRole('button', { name: 'IBAN à compléter' }))
    await waitFor(() => expect(document.querySelector('#apparence-mentions .section-atelier__tete')).toHaveAttribute('aria-expanded', 'true'))
  })

  it('la roue est utilisable au clavier', () => {
    monter()
    const roue = screen.getByRole('slider', { name: /Couleur principale : teinte/ })
    const avant = Number(roue.getAttribute('aria-valuenow'))
    fireEvent.keyDown(roue, { key: 'ArrowRight' })
    expect(Number(roue.getAttribute('aria-valuenow'))).not.toBe(avant)
    expect(screen.getByRole('slider', { name: /luminosité/ })).toHaveAttribute('aria-valuemax', '100')
  })

  it('quitter sans modification ne demande rien, avec modification demande confirmation', async () => {
    const { routeur } = monter()
    await act(() => routeur.navigate('/autre'))
    expect(screen.getByText('Autre page')).toBeInTheDocument()

    await act(() => routeur.navigate('/'))
    ouvrir('apparence-police')
    fireEvent.click(screen.getByRole('radio', { name: 'Classique' }))
    await act(() => routeur.navigate('/autre'))
    expect(screen.getByRole('dialog', { name: /Quitter sans enregistrer/ })).toBeInTheDocument()
    expect(screen.queryByText('Autre page')).not.toBeInTheDocument()
  })

  it('Revenir au modèle par défaut conserve les mentions légales', () => {
    monter()
    ouvrir('apparence-mentions')
    fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: 'FR7612345' } })
    ouvrir('apparence-police')
    fireEvent.click(screen.getByRole('radio', { name: 'Classique' }))
    fireEvent.click(screen.getByRole('button', { name: /Revenir au modèle par défaut/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Revenir au modèle par défaut' }))
    expect(screen.getByRole('radio', { name: 'Moderne' })).toBeChecked()
    expect(screen.getByLabelText('IBAN')).toHaveValue('FR7612345')
  })

  it('un fichier d’un autre format est refusé avec un message', async () => {
    monter()
    const fichier = new File(['x'], 'logo.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Fichier du logo'), { target: { files: [fichier] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(/Format non pris en charge/)
  })

  it('un code couleur incomplet n’est appliqué qu’à la sortie du champ', async () => {
    monter()
    const champ = screen.getByLabelText('Couleur principale')
    fireEvent.focus(champ)
    const couleur = () => document.querySelector<HTMLElement>('.atelier__apercu .doc')!.style.getPropertyValue('--doc-p')
    fireEvent.change(champ, { target: { value: '#12' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(couleur()).toBe('#0B2A50')
    fireEvent.change(champ, { target: { value: '#123456' } })
    await waitFor(() => expect(couleur()).toBe('#123456'))
    fireEvent.change(champ, { target: { value: 'zz' } })
    fireEvent.blur(champ)
    expect(screen.getByRole('alert')).toHaveTextContent(/pas un code valide/)
  })
})
