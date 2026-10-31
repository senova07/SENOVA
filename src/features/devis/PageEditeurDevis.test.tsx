import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { SessionContext, type SessionContextValue } from '@/store/sessionContext'
import { apiArticles } from '@/services/articlesApi'
import { apiClients } from '@/services/clientsApi'
import type { Article } from '@shared/articles'
import type { Client } from '@shared/clients'
import type { Organisation } from '@shared/session'
import { reinitialiserDemoDevis } from './api'
import { DEVIS_DEMO } from './demo'
import { magasinDevis } from './magasin'
import { PageEditeurDevis } from './PageEditeurDevis'
import type { Devis, LigneDevis } from './types'

const organisation = { id: 'o1', nom: 'Atelier Martin', pays: 'FR' } as Organisation
const session = { etat: 'connecte', session: { organisation } } as unknown as SessionContextValue

const sophie = {
  id: 'c1', nature: 'particulier', nom: 'Durand', prenom: 'Sophie', email: 'sophie@mail.fr', telephone: '0612345678',
  adresses: [{ id: 'a', libelle: '', ligne1: '8 rue Paul Bert', ligne2: null, codePostal: '69003', ville: 'Lyon', pays: 'FR', parDefaut: true }],
} as unknown as Client

const mitigeur = {
  id: 'a1', reference: 'PR-014', nom: 'Mitigeur thermostatique', description: '', type: 'produit', unite: 'u',
  prixUnitaireHt: 100, tauxTva: 20, favori: true, actif: true,
} as unknown as Article

const ligne = (designation: string): LigneDevis => ({
  id: `l-${designation}`, genre: 'article', designation, quantite: 1, unite: 'u', prixUnitaireHt: 10, tauxTva: 20, remisePourcent: 0,
})

const base: Devis = { ...DEVIS_DEMO[0]!, clientNom: '', clientAdresse: '', objet: '', lignes: [] }

function monter(id: string, devis?: Partial<Devis>) {
  if (devis) magasinDevis.enregistrer({ ...base, id, ...devis })
  return render(
    <SessionContext.Provider value={session}>
      <MemoryRouter initialEntries={[`/devis/${id}`]}>
        <Routes>
          <Route path="/devis/:id" element={<PageEditeurDevis />} />
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  )
}

const pret = () => screen.findByRole('heading', { level: 1 })
const apercu = (zone: string) => screen.getByRole('button', { name: zone })
const tete = (id: string) => document.querySelector<HTMLButtonElement>(`#${id} > button`)!

describe('PageEditeurDevis', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = () => {}
  })
  afterEach(() => vi.restoreAllMocks())

  it('choisit un client de l’API : carte, adresse et aperçu', async () => {
    vi.spyOn(apiClients, 'lister').mockResolvedValue({ donnees: [sophie], total: 1, page: 1, parPage: 8 })
    monter('t-client', {})
    await pret()
    expect(within(apercu('Modifier le client')).getByText('Aucun client sélectionné')).toBeTruthy()

    fireEvent.click(await screen.findByRole('button', { name: /Sophie Durand/ }))

    expect(await screen.findByRole('button', { name: 'Changer' })).toBeTruthy()
    expect(screen.getByText('Adresse de facturation').nextElementSibling).toHaveTextContent('8 rue Paul Bert 69003 Lyon')
    expect(within(apercu('Modifier le client')).getByText(/Sophie Durand/)).toBeTruthy()
  })

  it('ajoute un article du catalogue et met le TTC à jour dans l’aperçu', async () => {
    vi.spyOn(apiArticles, 'lister').mockResolvedValue([mitigeur])
    monter('t-article', {})
    await pret()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un article' }))
    fireEvent.click(await screen.findByRole('button', { name: /Mitigeur thermostatique/ }))

    expect(screen.getByLabelText('Désignation, ligne 1')).toHaveValue('Mitigeur thermostatique')
    expect(screen.getByLabelText('Prix unitaire HT, ligne 1')).toHaveValue('100')
    const totaux = apercu('Modifier le récapitulatif')
    expect(totaux).toHaveTextContent(/120,00/)

    fireEvent.change(screen.getByLabelText('Quantité, ligne 1'), { target: { value: '2' } })
    expect(totaux).toHaveTextContent(/240,00/)
  })

  it('déplace une ligne avec Alt + flèche bas', async () => {
    monter('t-ordre', { lignes: [ligne('A'), ligne('B')] })
    await pret()
    const noms = () => screen.getAllByLabelText(/^Désignation, ligne/).map((i) => (i as HTMLInputElement).value)
    expect(noms()).toEqual(['A', 'B'])
    const poignee = screen.getByRole('button', { name: /Déplacer la ligne 1/ })
    fireEvent.keyDown(poignee, { key: 'ArrowDown' }) // sans Alt : rien
    expect(noms()).toEqual(['A', 'B'])
    fireEvent.keyDown(poignee, { key: 'ArrowDown', altKey: true })
    expect(noms()).toEqual(['B', 'A'])
  })

  it('un clic sur une zone de l’aperçu ouvre la section correspondante', async () => {
    monter('t-saut', {})
    await pret()
    fireEvent.click(tete('devis-s-client'))
    expect(tete('devis-s-client')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(apercu('Modifier le client'))
    await waitFor(() => expect(tete('devis-s-client')).toHaveAttribute('aria-expanded', 'true'))

    expect(tete('devis-s-conditions')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(apercu('Modifier les conditions'))
    await waitFor(() => expect(tete('devis-s-conditions')).toHaveAttribute('aria-expanded', 'true'))
  })

  it('enregistre le brouillon en le disant honnêtement ; PDF et envoi ne sont pas branchés', async () => {
    monter('t-pied', {})
    await pret()
    expect(screen.getByText(/Démo : ce brouillon n’est pas sauvegardé/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Objet du devis'), { target: { value: 'Salle de bain' } })
    expect(screen.getByText('Modifications non enregistrées')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le brouillon' }))
    expect(await screen.findByText(/Brouillon enregistré dans cette session \(démo : non sauvegardé sur le serveur\)/)).toBeTruthy()
    expect(magasinDevis.lire().find((d) => d.id === 't-pied')?.objet).toBe('Salle de bain')

    for (const nom of ['Envoyer au client', 'Aperçu PDF']) {
      const bouton = screen.getByRole('button', { name: nom })
      expect(bouton).toBeDisabled()
      expect(bouton).toHaveAccessibleDescription(/bientôt/)
      fireEvent.click(bouton)
    }
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(magasinDevis.lire().find((d) => d.id === 't-pied')?.statut).toBe('brouillon')
  })

  it('un dépôt réordonne sans écrire l’id dans un champ (type MIME propre)', async () => {
    monter('t-depot', { lignes: [ligne('A'), ligne('B')] })
    await pret()
    const donnees: Record<string, string> = {}
    const dataTransfer = { effectAllowed: '', setData: (t: string, v: string) => { donnees[t] = v } }
    const poignee = screen.getByRole('button', { name: /Déplacer la ligne 2/ })
    fireEvent.dragStart(poignee, { dataTransfer })
    expect(Object.keys(donnees)).toEqual(['application/x-senova-ligne'])
    const cible = document.querySelector('[data-ligne="l-A"]')!
    fireEvent.dragOver(cible, { dataTransfer }) // jsdom : pas de coordonnées, la ligne est déposée avant la cible
    expect(fireEvent.drop(cible, { dataTransfer })).toBe(false) // preventDefault appelé
    expect(screen.getAllByLabelText(/^Désignation, ligne/).map((i) => (i as HTMLInputElement).value)).toEqual(['B', 'A'])
  })

  it('quitter l’écran avec des modifications les enregistre', async () => {
    const { unmount } = monter('t-quitter', {})
    await pret()
    fireEvent.change(screen.getByLabelText('Objet du devis'), { target: { value: 'Quitté' } })
    unmount()
    await waitFor(() => expect(magasinDevis.lire().find((d) => d.id === 't-quitter')?.objet).toBe('Quitté'))
  })

  it('Annuler revient au client actuel après « Changer »', async () => {
    monter('t-annuler', { clientNom: 'Sophie Durand', clientAdresse: '8 rue X, 69003 Lyon' })
    await pret()
    fireEvent.click(screen.getByRole('button', { name: 'Changer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByRole('button', { name: 'Changer' })).toBeTruthy()
  })

  it('signale une erreur de l’API clients', async () => {
    vi.spyOn(apiClients, 'lister').mockRejectedValue(new Error('500'))
    monter('t-erreur', {})
    await pret()
    expect(await screen.findByText('Impossible de charger les clients.')).toBeTruthy()
  })

  it('réinitialise les devis de démo (changement d’organisation)', async () => {
    magasinDevis.enregistrer({ ...base, id: 'fuite' })
    reinitialiserDemoDevis()
    expect(magasinDevis.lire().map((d) => d.id)).toEqual(DEVIS_DEMO.map((d) => d.id))
  })

  it('fige un devis accepté', async () => {
    monter('d3')
    await pret()
    expect(screen.getByRole('note')).toHaveTextContent('accepté')
    expect(screen.getByLabelText('Objet du devis')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })

  it('propose un retour quand le devis est inconnu', async () => {
    monter('inconnu')
    expect(await screen.findByText('Devis introuvable')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Retour aux devis' })).toHaveAttribute('href', '/devis')
  })
})
