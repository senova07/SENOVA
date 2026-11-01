import { describe, expect, it } from 'vitest'
import type { Client } from '@shared/clients'
import {
  adresseParDefaut,
  adresseVide,
  avecTag,
  brouillonDe,
  erreursDepuisApi,
  sansAdresse,
  valider,
  versSaisie,
} from './saisieClient'
import {
  compterClients,
  filtrerClients,
  ongletDepuisUrl,
  paginer,
  tagsConnus,
  trierClients,
  triSuivant,
} from './vueClients'

const client = (o: Partial<Client>): Client => ({
  id: '1',
  nature: 'particulier',
  nom: 'Martin',
  prenom: 'Claire',
  email: null,
  telephone: null,
  siren: null,
  siret: null,
  tvaIntracom: null,
  tags: [],
  archiveLe: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  ...o,
})

describe('vue de la liste', () => {
  const martin = client({ tags: ['fidèle'] })
  const zola = client({ id: '2', nom: 'Zola', prenom: null, nature: 'entreprise', tags: ['syndic', 'fidèle'] })
  const tilleuls = client({ id: '3', nom: 'SCI Les Tilleuls', prenom: null, nature: 'entreprise' })
  const tous = [zola, martin, tilleuls]

  it('retombe sur « Tous » pour un onglet inconnu', () => {
    expect(ongletDepuisUrl('archives')).toBe('archives')
    expect(ongletDepuisUrl('nimporte')).toBe('tous')
    expect(ongletDepuisUrl(null)).toBe('tous')
  })

  it('filtre par onglet, tag et solde dû', () => {
    const base = { tag: '', soldeDu: false }
    expect(filtrerClients(tous, { ...base, onglet: 'particuliers' })).toEqual([martin])
    expect(filtrerClients(tous, { ...base, onglet: 'professionnels' })).toEqual([zola, tilleuls])
    expect(filtrerClients(tous, { ...base, onglet: 'tous', tag: 'syndic' })).toEqual([zola])
    // Les archivés sont déjà isolés par le serveur : l'onglet ne filtre pas la nature.
    expect(filtrerClients(tous, { ...base, onglet: 'archives' })).toHaveLength(3)
    expect(filtrerClients(tous, { ...base, onglet: 'tous', soldeDu: true })).toEqual([tilleuls])
  })

  it('liste les tags sans doublon, triés', () => {
    expect(tagsConnus(tous)).toEqual(['fidèle', 'syndic'])
  })

  it('trie par nom sans tenir compte des accents ni du sens, sans modifier la source', () => {
    expect(trierClients(tous, { cle: 'nom', sens: 'asc' }).map((c) => c.id)).toEqual(['1', '3', '2'])
    expect(trierClients(tous, { cle: 'nom', sens: 'desc' }).map((c) => c.id)).toEqual(['2', '3', '1'])
    expect(trierClients(tous, { cle: 'du', sens: 'desc' })[0]).toBe(tilleuls)
    expect(tous[0]).toBe(zola)
    expect(trierClients(tous, null)).toEqual(tous)
  })

  it('enchaîne croissant, décroissant, aucun tri', () => {
    const asc = triSuivant(null, 'nom')
    expect(asc).toEqual({ cle: 'nom', sens: 'asc' })
    const desc = triSuivant(asc, 'nom')
    expect(desc).toEqual({ cle: 'nom', sens: 'desc' })
    expect(triSuivant(desc, 'nom')).toBeNull()
    expect(triSuivant(desc, 'du')).toEqual({ cle: 'du', sens: 'asc' })
  })

  it('pagine en bornant la page', () => {
    expect(paginer(30, 2, 12)).toEqual({ pages: 3, page: 2, debut: 12 })
    expect(paginer(30, 9, 12)).toEqual({ pages: 3, page: 3, debut: 24 })
    expect(paginer(0, 1, 12)).toEqual({ pages: 1, page: 1, debut: 0 })
  })

  it('compte clients, professionnels et nouveaux du mois', () => {
    const maintenant = new Date(2026, 5, 20)
    const recent = client({ id: '4', createdAt: new Date(2026, 5, 3).toISOString() })
    expect(compterClients([zola, martin, recent], maintenant)).toEqual({
      total: 3,
      professionnels: 1,
      nouveauxCeMois: 1,
    })
  })
})

describe('saisie d’un client', () => {
  it('ne garde pas les champs d’entreprise pour un particulier', () => {
    const b = { ...brouillonDe(null), nom: ' Dupont ', siret: '123', prenom: ' Léa ', email: ' ' }
    expect(versSaisie(b)).toMatchObject({ nom: 'Dupont', prenom: 'Léa', siret: null, email: null })
  })

  it('garde SIRET et supprime le prénom pour une entreprise', () => {
    const b = { ...brouillonDe(null), nature: 'entreprise' as const, nom: 'SARL', prenom: 'x', siret: ' 123 ' }
    expect(versSaisie(b)).toMatchObject({ prenom: null, siret: '123' })
  })

  it('refuse un nom vide avec un message selon la nature', () => {
    expect(valider(brouillonDe(null)).nom).toBe('Renseignez le nom.')
    expect(valider({ ...brouillonDe(null), nature: 'entreprise' }).nom).toBe('Renseignez la raison sociale.')
    expect(valider({ ...brouillonDe(null), nom: 'A' })).toEqual({})
  })

  it('met le pays par défaut à FR et conserve un pays étranger', () => {
    const adresse = { ...adresseVide(true), pays: ' ' }
    const b = { ...brouillonDe(null), adresses: [adresse, { ...adresseVide(false), pays: 'BE' }] }
    expect(versSaisie(b).adresses?.map((a) => a.pays)).toEqual(['FR', 'BE'])
  })

  it('garde la première erreur de l’API par champ', () => {
    expect(
      erreursDepuisApi([
        { field: 'adresses.0.ville', message: 'a' },
        { field: 'adresses.0.ville', message: 'b' },
        { message: 'sans champ' },
      ]),
    ).toEqual({ 'adresses.0.ville': 'a' })
  })

  it('désigne une autre adresse par défaut quand on retire celle par défaut', () => {
    const [a, b] = [adresseVide(true), adresseVide(false)]
    expect(sansAdresse([a, b], a.cle).map((x) => x.parDefaut)).toEqual([true])
    expect(sansAdresse([a, b], b.cle)[0]?.parDefaut).toBe(true)
    expect(adresseParDefaut([a, b], b.cle).map((x) => x.parDefaut)).toEqual([false, true])
  })

  it('ajoute un tag une seule fois, sans tenir compte de la casse', () => {
    expect(avecTag(['Fidèle'], ' fidèle ')).toEqual(['Fidèle'])
    expect(avecTag(['a'], '   ')).toEqual(['a'])
    expect(avecTag(['a'], 'b')).toEqual(['a', 'b'])
  })
})
