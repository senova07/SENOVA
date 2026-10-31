/**
 * Types du rendu des documents. Le rendu est pur : tous les montants arrivent déjà calculés
 * (la TVA, les remises et les totaux sont calculés dans la feature devis, jamais ici).
 */

export type TypeDocument = 'devis' | 'facture' | 'avoir'

export interface AdresseDocument {
  rue: string
  codePostal: string
  ville: string
}

export interface EmetteurDocument {
  nom: string
  activite: string
  adresse: AdresseDocument
  telephone: string
  email: string
}

export interface ClientDocument {
  civilite?: string
  nom: string
  adresse: AdresseDocument
}

export interface LignePrestation {
  type: 'prestation'
  id: string
  designation: string
  reference?: string
  quantite: number
  unite: string
  prixUnitaireHt: number
  /** Taux de TVA en pourcentage (20, 10, 5.5, 0). */
  tauxTva: number
  /** Remise de la ligne en pourcentage, 0 si aucune (informatif : le total HT en tient déjà compte). */
  remisePct: number
  totalHt: number
}

export interface LigneSection {
  type: 'section'
  id: string
  titre: string
  /** Sous-total HT de la section. */
  totalHt: number
}

export interface LigneTexte {
  type: 'texte'
  id: string
  texte: string
}

export type LigneDocument = LignePrestation | LigneSection | LigneTexte

export interface LigneTva {
  taux: number
  base: number
  montant: number
}

/**
 * Contrat de signe : tous les montants arrivent POSITIFS. Le rendu applique le signe de l'avoir
 * (montants, remise, acompte) et affiche la remise en déduction ; l'appelant ne passe jamais de négatif.
 */
export interface TotauxDocument {
  /** Total HT après remise globale (base de la TVA). */
  totalHt: number
  /** Total HT avant remise globale ; affiché avec la remise, dans l'ordre sous-total, remise, total HT. */
  sousTotalHt?: number
  /** Remise globale en montant positif, affichée si > 0 et si `sousTotalHt` est fourni. */
  remise?: number
  tva: LigneTva[]
  totalTva: number
  totalTtc: number
  acompte?: { pourcentage: number; montant: number }
  /** Facture : TTC moins l'acompte déjà versé. */
  resteAPayer?: number
}

export interface MentionsLegales {
  siret: string
  numeroTva: string
  formeJuridique: string
  capital: string
  registre: string
  assureur: string
  contratAssurance: string
  zoneAssurance: string
  iban: string
  bic: string
}

export interface TextesDocument {
  conditions: string
  remerciement: string
  validite: string
  penalites: string
  indemnite: string
}

export interface DocumentRendu {
  type: TypeDocument
  numero: string
  /** Dates au format ISO « 2026-10-31 ». */
  dateEmission: string
  /** Fin de validité (devis) ou échéance (facture). */
  dateEcheance?: string
  /** Numéro du devis (facture) ou de la facture (avoir) auquel le document se rattache. */
  referenceLiee?: string
  emetteur: EmetteurDocument
  /** null : aucun client choisi, l'aperçu l'indique. */
  client: ClientDocument | null
  /** Adresse du chantier si elle diffère de celle du client. */
  adresseChantier?: AdresseDocument
  objet?: string
  lignes: LigneDocument[]
  /** Texte libre (notes) affiché sous les conditions d'un devis. */
  texteLibre?: string
  totaux: TotauxDocument
  conditionsPaiement: string
  moyensPaiement: string[]
  mentions: MentionsLegales
  textes: TextesDocument
  /** Présent : bloc « Bon pour accord » (devis, si la charte l'autorise). */
  bonPourAccord?: { mention: string }
}

/* ───── Charte graphique ───── */

export type ModelePageId =
  | 'classique-pro' | 'colonne' | 'hero' | 'plan' | 'epure' | 'bandeau' | 'bloc-client' | 'artisan'

export type StyleTableauId =
  | 'standard' | 'entete' | 'alterne' | 'numeros' | 'cartes' | 'minimal' | 'montant' | 'sans-tva' | 'groupes' | 'bordures'

export type PoliceId = 'geist' | 'serif' | 'lisible' | 'arrondie'

export interface OptionsAffichage {
  afficherReferences: boolean
  afficherUnites: boolean
  regrouperSections: boolean
  afficherSignature: boolean
  afficherQr: boolean
}

export interface ChartePage {
  modele: ModelePageId
  styleTableau: StyleTableauId
  couleurPrincipale: string
  couleurAccent: string
  police: PoliceId
  /** Image importée (data URL) ; sans logo, un logo neutre aux couleurs de la charte. */
  logo?: string
  /** Photo de réalisation (modèles « Hero image » et « Artisan »). Sans photo, un motif à facettes la remplace. */
  photo?: string
  tailleLogo: 'S' | 'M' | 'L'
  alignementLogo: 'gauche' | 'centre'
  afficherContact: boolean
  piedDePage: string
  afficherMentionsLegales: boolean
  options: OptionsAffichage
}

/** Zones de l'aperçu qui peuvent renvoyer vers l'étape de modification correspondante. */
export type ZoneDocument = 'entete' | 'client' | 'informations' | 'lignes' | 'totaux' | 'conditions' | 'pied'
