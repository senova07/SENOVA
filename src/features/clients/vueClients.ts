import { sansAccent } from '@/lib/texte'
import { nomAffichageClient, type Client } from '@shared/clients'
import { resteDuClient } from './documentsClient'

export const ONGLETS = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'particuliers', libelle: 'Particuliers' },
  { id: 'professionnels', libelle: 'Professionnels' },
  { id: 'archives', libelle: 'Archivés' },
] as const
export type OngletClients = (typeof ONGLETS)[number]['id']

export type ColonneClient = 'contact' | 'tags' | 'du'
export const COLONNES_CLIENT: readonly { id: ColonneClient; libelle: string }[] = [
  { id: 'contact', libelle: 'Contact' },
  { id: 'tags', libelle: 'Tags' },
  { id: 'du', libelle: 'Montant dû' },
]

export type CleTriClient = 'nom' | 'contact' | 'du'
export interface TriClient {
  cle: CleTriClient
  sens: 'asc' | 'desc'
}

const NATURE_ONGLET = { particuliers: 'particulier', professionnels: 'entreprise' } as const
const comparerTexte = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare

/** Onglet demandé par l'URL ; une valeur inconnue retombe sur « Tous ». */
export const ongletDepuisUrl = (valeur: string | null): OngletClients =>
  ONGLETS.find((o) => o.id === valeur)?.id ?? 'tous'

export const tagsConnus = (clients: readonly Client[]): string[] =>
  [...new Set(clients.flatMap((c) => c.tags))].sort(comparerTexte)

export interface FiltresClients {
  onglet: OngletClients
  tag: string
  soldeDu: boolean
}

export function filtrerClients(clients: readonly Client[], { onglet, tag, soldeDu }: FiltresClients): Client[] {
  const nature = onglet === 'tous' || onglet === 'archives' ? null : NATURE_ONGLET[onglet]
  return clients.filter(
    (c) =>
      (!nature || c.nature === nature) &&
      (!tag || c.tags.includes(tag)) &&
      (!soldeDu || resteDuClient(c) > 0),
  )
}

const valeurTri = (c: Client, cle: CleTriClient): string | number =>
  cle === 'nom'
    ? sansAccent(nomAffichageClient(c))
    : cle === 'contact'
      ? (c.email ?? c.telephone ?? '')
      : resteDuClient(c)

export function trierClients(clients: readonly Client[], tri: TriClient | null): Client[] {
  if (!tri) return [...clients]
  return [...clients].sort((a, b) => {
    const va = valeurTri(a, tri.cle)
    const vb = valeurTri(b, tri.cle)
    const ecart =
      typeof va === 'number' && typeof vb === 'number' ? va - vb : comparerTexte(String(va), String(vb))
    return tri.sens === 'asc' ? ecart : -ecart
  })
}

/** Clics successifs sur une colonne : croissant, décroissant, puis retour à l'ordre du serveur. */
export const triSuivant = (tri: TriClient | null, cle: CleTriClient): TriClient | null =>
  tri?.cle !== cle ? { cle, sens: 'asc' } : tri.sens === 'asc' ? { cle, sens: 'desc' } : null

export function paginer(total: number, numero: number, parPage: number) {
  const pages = Math.max(1, Math.ceil(total / parPage))
  const page = Math.min(Math.max(1, numero), pages)
  return { pages, page, debut: (page - 1) * parPage }
}

export function compterClients(actifs: readonly Client[], maintenant: Date = new Date()) {
  return {
    total: actifs.length,
    professionnels: actifs.filter((c) => c.nature === 'entreprise').length,
    nouveauxCeMois: actifs.filter((c) => {
      const d = new Date(c.createdAt)
      return d.getFullYear() === maintenant.getFullYear() && d.getMonth() === maintenant.getMonth()
    }).length,
  }
}
