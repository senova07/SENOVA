import type { NomIcone } from '@/components/ui/Icone'
import type { TypeArticle } from '@shared/articles'

/** Colonnes masquables du tableau des articles (« Article » et « Actions » restent toujours). */
export const COLONNES = [
  { id: 'type', libelle: 'Type' },
  { id: 'categorie', libelle: 'Catégorie' },
  { id: 'prix', libelle: 'Prix HT' },
  { id: 'tva', libelle: 'TVA' },
  { id: 'unite', libelle: 'Unité' },
  { id: 'statut', libelle: 'Statut' },
  { id: 'marge', libelle: 'Marge' },
] as const
export type Colonne = (typeof COLONNES)[number]['id']
export type CleTri = 'nom' | Exclude<Colonne, 'marge'>
export interface Tri {
  cle: CleTri
  sens: 'asc' | 'desc'
}

export const ICONE_TYPE: Record<TypeArticle, NomIcone> = {
  produit: 'type_produit',
  service: 'type_service',
  main_oeuvre: 'type_main_oeuvre',
  deplacement: 'type_deplacement',
  abonnement: 'type_abonnement',
  forfait: 'type_forfait',
  autre: 'type_autre',
}
