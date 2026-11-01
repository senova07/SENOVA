/** Types métier des devis. Indépendants de l'écran et de la source des données (démo ou API). */

export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

/** Une prestation chiffrée (`article`), un titre de section (regroupe les lignes qui suivent) ou un texte libre. */
export interface LigneDevis {
  id: string
  genre: 'article' | 'section' | 'texte'
  designation: string
  description?: string
  reference?: string
  quantite: number
  unite: string
  prixUnitaireHt: number
  tauxTva: number
  /** Remise de la ligne en pourcentage (0 si aucune). */
  remisePourcent: number
}

/** Remise globale : en pourcentage, ou un montant HT fixe qui ne bouge pas quand les lignes changent. */
export interface Remise {
  mode: 'pourcent' | 'montant'
  valeur: number
}

export interface AdresseChantier {
  rue: string
  codePostal: string
  ville: string
}

export interface Devis {
  id: string
  numero: string
  /** Fiche client (API clients) ; absent pour un devis de démo. Les champs `client*` en sont une copie figée. */
  clientId?: string
  clientNom: string
  /** Adresse de facturation, une ligne par partie (rue, puis « code postal ville »). */
  clientAdresse: string
  clientEmail?: string
  clientTelephone?: string
  /** Présent seulement si le chantier n'est pas à l'adresse du client. */
  adresseChantier?: AdresseChantier
  objet: string
  statut: StatutDevis
  /** Dates ISO (AAAA-MM-JJ). */
  dateCreation: string
  validiteJours: number
  envoyeLe?: string
  lignes: LigneDevis[]
  remise: Remise
  acomptePourcent: number
  /** Conditions de paiement. */
  conditions: string
  moyensPaiement: string[]
  /** Note pour le client, imprimée sur le devis. */
  notes: string
  /** Horodatage ISO du dernier enregistrement. */
  majLe: string
}

export interface Totaux {
  totalHtBrut: number
  remiseMontant: number
  totalHt: number
  tva: { taux: number; base: number; montant: number }[]
  totalTva: number
  totalTtc: number
  /** Acompte demandé (TTC), arrondi au centime. */
  acompte: number
}
