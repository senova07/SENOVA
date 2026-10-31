import { nouvelId } from './calculs'
import type { Devis, LigneDevis, Remise } from './types'

/** Jeux de démo : à retirer quand l'API devis, factures et prestations existera. */

const ligne = (
  designation: string,
  quantite: number,
  unite: string,
  prixUnitaireHt: number,
  tauxTva = 20,
  extra: Partial<LigneDevis> = {},
): LigneDevis => ({
  id: nouvelId(),
  genre: 'article',
  designation,
  quantite,
  unite,
  prixUnitaireHt,
  tauxTva,
  remisePourcent: 0,
  ...extra,
})

const section = (designation: string): LigneDevis => ({
  id: nouvelId(),
  genre: 'section',
  designation,
  quantite: 0,
  unite: '',
  prixUnitaireHt: 0,
  tauxTva: 0,
  remisePourcent: 0,
})

const CONDITIONS =
  'Acompte de 30 % à la signature, solde à réception de facture. Paiement par virement.'
const base = {
  validiteJours: 30,
  remise: { mode: 'pourcent', valeur: 0 } as Remise,
  acomptePourcent: 30,
  conditions: CONDITIONS,
  notes: '',
  moyensPaiement: ['Virement bancaire'],
}

export const DEVIS_DEMO: Devis[] = [
  {
    ...base,
    id: 'd1',
    numero: 'DEV-2026-0042',
    clientNom: 'Boulangerie Lefèvre',
    clientAdresse: '8 place Bellecour\n69002 Lyon',
    clientEmail: 'contact@boulangerie-lefevre.fr',
    objet: 'Mise aux normes du tableau électrique',
    statut: 'brouillon',
    dateCreation: '2026-10-24',
    majLe: '2026-10-24T16:12:00',
    lignes: [
      section('Dépose et préparation'),
      ligne('Dépose ancien tableau', 1, 'forfait', 180, 20, { reference: 'MO-DEP' }),
      ligne("Main-d'œuvre électricien", 6, 'h', 52, 20, { reference: 'MO-ELEC' }),
      section('Fourniture et pose'),
      ligne('Tableau électrique 3 rangées', 1, 'u', 389, 20, { reference: 'TAB-3R' }),
      ligne('Disjoncteur différentiel 30 mA', 3, 'u', 64.5, 20, { reference: 'DIF-30' }),
      ligne('Câblage et repérage', 1, 'forfait', 240, 20),
    ],
  },
  {
    ...base,
    id: 'd2',
    numero: 'DEV-2026-0041',
    clientNom: 'Martin Dupont',
    clientAdresse: '23 rue Victor Hugo\n69100 Villeurbanne',
    clientEmail: 'm.dupont@mail.fr',
    objet: 'Installation pompe à chaleur air/eau',
    statut: 'envoye',
    dateCreation: '2026-10-15',
    envoyeLe: '2026-10-15',
    remise: { mode: 'montant', valeur: 300 },
    majLe: '2026-10-15T10:40:00',
    lignes: [
      ligne('Pompe à chaleur 8 kW', 1, 'u', 6890, 5.5, { reference: 'PAC-8' }),
      ligne('Ballon tampon 100 L', 1, 'u', 540, 5.5),
      ligne('Pose et mise en service', 2, 'j', 620, 5.5),
      ligne('Déplacement', 1, 'forfait', 45, 20),
    ],
  },
  {
    ...base,
    id: 'd3',
    numero: 'DEV-2026-0040',
    clientNom: 'SCI Les Tilleuls',
    clientAdresse: '4 allée des Tilleuls\n69500 Bron',
    objet: 'Remplacement luminaires parties communes',
    statut: 'accepte',
    dateCreation: '2026-10-08',
    envoyeLe: '2026-10-08',
    majLe: '2026-10-11T09:05:00',
    lignes: [
      ligne('Hublot LED détecteur', 24, 'u', 48, 20),
      ligne('Pose luminaire', 24, 'u', 22, 20),
      ligne('Nacelle (location)', 1, 'j', 190, 20),
    ],
  },
  {
    ...base,
    id: 'd4',
    numero: 'DEV-2026-0039',
    clientNom: 'Claire Moreau',
    clientAdresse: '15 chemin du Lavoir\n69130 Écully',
    objet: 'Climatisation réversible séjour',
    statut: 'envoye',
    dateCreation: '2026-09-22',
    envoyeLe: '2026-09-23',
    majLe: '2026-09-23T14:30:00',
    lignes: [
      ligne('Climatiseur mural 3,5 kW', 1, 'u', 1290, 10),
      ligne('Pose et liaison frigorifique', 1, 'forfait', 680, 10),
    ],
  },
  {
    ...base,
    id: 'd5',
    numero: 'DEV-2026-0038',
    clientNom: 'Garage Rossi',
    clientAdresse: '102 avenue Jean Jaurès\n69007 Lyon',
    objet: 'Éclairage atelier',
    statut: 'refuse',
    dateCreation: '2026-09-12',
    envoyeLe: '2026-09-12',
    majLe: '2026-09-20T11:00:00',
    lignes: [ligne('Réglette LED étanche 150 cm', 16, 'u', 72, 20), ligne('Pose', 8, 'h', 52, 20)],
  },
  {
    ...base,
    id: 'd6',
    numero: 'DEV-2026-0037',
    clientNom: 'Boulangerie Lefèvre',
    clientAdresse: '8 place Bellecour\n69002 Lyon',
    objet: 'Contrat entretien annuel',
    statut: 'expire',
    dateCreation: '2026-07-03',
    envoyeLe: '2026-07-03',
    majLe: '2026-07-03T08:15:00',
    lignes: [ligne('Visite annuelle de contrôle', 1, 'forfait', 290, 20)],
  },
]

/** Pièces de vente simplifiées, pour le tableau de bord et l'historique client. */
export interface FactureDemo {
  id: string
  numero: string
  clientNom: string
  date: string
  echeance: string
  montantTtc: number
  resteDu: number
  statut: 'payee' | 'en_attente' | 'en_retard'
}

export const FACTURES_DEMO: FactureDemo[] = [
  {
    id: 'f1',
    numero: 'FAC-2026-0118',
    clientNom: 'SCI Les Tilleuls',
    date: '2026-10-11',
    echeance: '2026-11-10',
    montantTtc: 2049.6,
    resteDu: 2049.6,
    statut: 'en_attente',
  },
  {
    id: 'f2',
    numero: 'FAC-2026-0115',
    clientNom: 'Garage Rossi',
    date: '2026-09-02',
    echeance: '2026-10-02',
    montantTtc: 1380,
    resteDu: 1380,
    statut: 'en_retard',
  },
  {
    id: 'f3',
    numero: 'FAC-2026-0112',
    clientNom: 'Boulangerie Lefèvre',
    date: '2026-08-28',
    echeance: '2026-09-27',
    montantTtc: 864,
    resteDu: 300,
    statut: 'en_retard',
  },
  {
    id: 'f4',
    numero: 'FAC-2026-0110',
    clientNom: 'Martin Dupont',
    date: '2026-10-03',
    echeance: '2026-10-03',
    montantTtc: 3120,
    resteDu: 0,
    statut: 'payee',
  },
  {
    id: 'f5',
    numero: 'FAC-2026-0108',
    clientNom: 'Claire Moreau',
    date: '2026-10-01',
    echeance: '2026-10-31',
    montantTtc: 1850,
    resteDu: 0,
    statut: 'payee',
  },
]

export interface PrestationDemo {
  id: string
  heure: string
  clientNom: string
  objet: string
  adresse: string
}

export const PRESTATIONS_DU_JOUR: PrestationDemo[] = [
  {
    id: 'p1',
    heure: '08:30',
    clientNom: 'SCI Les Tilleuls',
    objet: 'Pose luminaires (jour 1/2)',
    adresse: '4 allée des Tilleuls, Bron',
  },
  {
    id: 'p2',
    heure: '14:00',
    clientNom: 'Claire Moreau',
    objet: 'Visite technique climatisation',
    adresse: '15 chemin du Lavoir, Écully',
  },
]

