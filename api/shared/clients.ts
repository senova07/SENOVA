/**
 * Contrat du module Clients, partagé par l'API et l'interface.
 * Contrat pur : aucune dépendance Adonis. Identifiants en chaîne.
 */

export const NATURES_CLIENT = ['particulier', 'entreprise'] as const
export type NatureClient = (typeof NATURES_CLIENT)[number]

export interface AdresseClient {
  id: string
  libelle: string
  ligne1: string
  ligne2: string | null
  codePostal: string
  ville: string
  pays: string
  parDefaut: boolean
}

export interface ContactClient {
  id: string
  nom: string
  role: string | null
  email: string | null
  telephone: string | null
}

export interface Client {
  id: string
  nature: NatureClient
  /** Nom du particulier ou raison sociale. */
  nom: string
  prenom: string | null
  email: string | null
  telephone: string | null
  siren: string | null
  siret: string | null
  tvaIntracom: string | null
  tags: string[]
  archiveLe: string | null
  createdAt: string
  /** Fiche seulement (GET /clients/:id et écritures), absents des listes. */
  notes?: string | null
  archiveMotif?: string | null
  /** Présentes sur la fiche (GET /clients/:id), absentes des listes. */
  adresses?: AdresseClient[]
  contacts?: ContactClient[]
}

/** Corps de POST / PUT. Sur PUT, `adresses` / `contacts` fournis remplacent les existants. */
export interface ClientSaisie {
  nature: NatureClient
  nom: string
  prenom?: string | null
  email?: string | null
  telephone?: string | null
  siren?: string | null
  siret?: string | null
  tvaIntracom?: string | null
  notes?: string | null
  tags?: string[]
  adresses?: (Pick<AdresseClient, 'libelle' | 'ligne1' | 'codePostal' | 'ville'> &
    Partial<Pick<AdresseClient, 'ligne2' | 'pays' | 'parDefaut'>>)[]
  contacts?: (Pick<ContactClient, 'nom'> & Partial<Omit<ContactClient, 'id' | 'nom'>>)[]
}

export interface PageClients {
  donnees: Client[]
  total: number
  page: number
  parPage: number
}

export function nomAffichageClient(client: Pick<Client, 'nature' | 'nom' | 'prenom'>): string {
  if (client.nature === 'particulier' && client.prenom) return `${client.prenom} ${client.nom}`
  return client.nom
}
