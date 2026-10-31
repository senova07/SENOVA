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
