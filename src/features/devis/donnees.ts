import { useSyncExternalStore } from 'react'
import type { NomIcone } from '@/components/ui/Icone'

/**
 * Maquette du lot 2 : devis, modèles de devis et pièces de vente vivent en mémoire côté front.
 * shortcut: aucune persistance serveur, tout repart des données de démo au rechargement ;
 * remplacer par des appels API quand le backend Devis existera.
 */

export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

export const LIBELLES_STATUT_DEVIS: Record<StatutDevis, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
}

/** Une ligne chiffrée, un titre de section (regroupe les lignes qui suivent) ou un texte libre. */
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
  remisePourcent: number
}

/** Remise globale : en pourcentage, ou un montant HT fixe qui ne bouge pas quand les lignes changent. */
export interface Remise {
  mode: 'pourcent' | 'montant'
  valeur: number
}

export interface Devis {
  id: string
  numero: string
  clientNom: string
  clientAdresse: string
  clientEmail?: string
  objet: string
  statut: StatutDevis
  /** Dates ISO (AAAA-MM-JJ). */
  dateCreation: string
  validiteJours: number
  envoyeLe?: string
  lignes: LigneDevis[]
  remise: Remise
  acomptePourcent: number
  conditions: string
  notes: string
  modeleId: string
  /** Horodatage ISO du dernier enregistrement (auto-save). */
  majLe: string
}

export type PoliceModele = 'moderne' | 'classique' | 'technique'
export type EnteteModele = 'gauche' | 'centre' | 'bandeau'
export type TableauModele = 'lignes' | 'zebre' | 'grille'

/** Le design d'un devis, choisi par l'entreprise. */
export interface ModeleDevis {
  id: string
  nom: string
  parDefaut: boolean
  couleurAccent: string
  police: PoliceModele
  entete: EnteteModele
  tableau: TableauModele
  densite: 'aeree' | 'compacte'
  afficher: {
    logo: boolean
    references: boolean
    tvaParLigne: boolean
    remiseParLigne: boolean
    signature: boolean
    conditions: boolean
  }
  texteIntro: string
  conditions: string
  piedDePage: string
}

/** Émetteur affiché sur la feuille (maquette : en dur, viendra des paramètres Entreprise). */
export const EMETTEUR = {
  nom: 'Démo SENOVA',
  adresse: '12 rue des Artisans\n69003 Lyon',
  telephone: '04 78 00 00 00',
  email: 'contact@demo-senova.fr',
  siret: '912 345 678 00011',
  tvaIntracom: 'FR12 912345678',
}

export const DUREES_VALIDITE = [15, 30, 60, 90] as const

// ---------- Calculs ----------

export const arrondir = (n: number) => Math.round(n * 100) / 100

/** Date du jour en heure locale (AAAA-MM-JJ) ; `toISOString` donnerait la date UTC. */
export const aujourdhuiIso = (): string => new Date().toLocaleDateString('sv-SE')

/** Comparaison sans casse ni accents. */
export const sansAccent = (t: string): string =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const totalLigneHt = (l: LigneDevis): number =>
  l.genre === 'article' ? arrondir(l.quantite * l.prixUnitaireHt * (1 - l.remisePourcent / 100)) : 0

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

/**
 * Totaux du devis ; la remise globale est répartie au prorata de chaque base de TVA, l'écart
 * d'arrondi reporté sur la dernière base pour que leur somme égale le total HT.
 */
export function calculerTotaux(
  lignes: readonly LigneDevis[],
  remise: Remise,
  acomptePourcent = 0,
): Totaux {
  const bases = new Map<number, number>()
  for (const l of lignes) {
    if (l.genre !== 'article') continue
    bases.set(l.tauxTva, (bases.get(l.tauxTva) ?? 0) + totalLigneHt(l))
  }
  const totalHtBrut = arrondir([...bases.values()].reduce((a, b) => a + b, 0))
  const brute = remise.mode === 'pourcent' ? (totalHtBrut * remise.valeur) / 100 : remise.valeur
  const remiseMontant = arrondir(Math.min(Math.max(brute, 0), totalHtBrut))
  const coef = totalHtBrut > 0 ? 1 - remiseMontant / totalHtBrut : 1
  const totalHt = arrondir(totalHtBrut - remiseMontant)
  const triees = [...bases.entries()].sort(([a], [b]) => a - b)
  let reste = totalHt
  const tva = triees.map(([taux, base], i) => {
    const baseRemisee = i === triees.length - 1 ? arrondir(reste) : arrondir(base * coef)
    reste -= baseRemisee
    return { taux, base: baseRemisee, montant: arrondir((baseRemisee * taux) / 100) }
  })
  const totalTva = arrondir(tva.reduce((a, t) => a + t.montant, 0))
  const totalTtc = arrondir(totalHt + totalTva)
  return {
    totalHtBrut,
    remiseMontant,
    totalHt,
    tva,
    totalTva,
    totalTtc,
    acompte: arrondir((totalTtc * acomptePourcent) / 100),
  }
}

/** Sous-total HT de la section qui commence à l'index donné (jusqu'à la section suivante). */
export function sousTotalSection(lignes: readonly LigneDevis[], index: number): number {
  let total = 0
  for (const l of lignes.slice(index + 1)) {
    if (l.genre === 'section') break
    total += totalLigneHt(l)
  }
  return arrondir(total)
}

export function dateFinValidite(d: Pick<Devis, 'dateCreation' | 'validiteJours'>): string {
  const date = new Date(`${d.dateCreation}T12:00:00`)
  date.setDate(date.getDate() + d.validiteJours)
  return date.toISOString().slice(0, 10)
}

export const nouvelId = (): string => Math.random().toString(36).slice(2, 10)

export const ICONE_STATUT_DEVIS: Record<StatutDevis, NomIcone> = {
  brouillon: 'crayon',
  envoye: 'envoyer',
  accepte: 'accepte',
  refuse: 'refuse',
  expire: 'horloge',
}

/** Copie d'un devis en nouveau brouillon (nouvel id, nouveau numéro, daté du jour). */
export function copierDevis(source: Devis, tous: readonly Devis[]): Devis {
  const maintenant = new Date().toISOString()
  return {
    ...source,
    id: nouvelId(),
    numero: prochainNumero(tous),
    statut: 'brouillon',
    dateCreation: aujourdhuiIso(),
    envoyeLe: undefined,
    majLe: maintenant,
    lignes: source.lignes.map((l) => ({ ...l, id: nouvelId() })),
  }
}

// ---------- Données de démo ----------

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

export const MODELES_DEMO: ModeleDevis[] = [
  {
    id: 'm-sobre',
    nom: 'Sobre',
    parDefaut: true,
    couleurAccent: '#034a78',
    police: 'moderne',
    entete: 'gauche',
    tableau: 'lignes',
    densite: 'aeree',
    afficher: {
      logo: true,
      references: false,
      tvaParLigne: true,
      remiseParLigne: false,
      signature: true,
      conditions: true,
    },
    texteIntro: 'Suite à notre échange, veuillez trouver ci-dessous notre proposition.',
    conditions: CONDITIONS,
    piedDePage: 'Démo SENOVA · SIRET 912 345 678 00011 · TVA FR12 912345678',
  },
  {
    id: 'm-bandeau',
    nom: 'Bandeau turquoise',
    parDefaut: false,
    couleurAccent: '#02a6ae',
    police: 'technique',
    entete: 'bandeau',
    tableau: 'zebre',
    densite: 'compacte',
    afficher: {
      logo: true,
      references: true,
      tvaParLigne: true,
      remiseParLigne: true,
      signature: true,
      conditions: true,
    },
    texteIntro: '',
    conditions: CONDITIONS,
    piedDePage: 'Démo SENOVA · SIRET 912 345 678 00011 · TVA FR12 912345678',
  },
  {
    id: 'm-classique',
    nom: 'Classique',
    parDefaut: false,
    couleurAccent: '#1f2a37',
    police: 'classique',
    entete: 'centre',
    tableau: 'grille',
    densite: 'aeree',
    afficher: {
      logo: true,
      references: false,
      tvaParLigne: false,
      remiseParLigne: false,
      signature: true,
      conditions: true,
    },
    texteIntro: 'Madame, Monsieur, nous avons le plaisir de vous adresser notre devis.',
    conditions: CONDITIONS,
    piedDePage: 'Démo SENOVA · SIRET 912 345 678 00011 · TVA FR12 912345678',
  },
]

const base = {
  validiteJours: 30,
  remise: { mode: 'pourcent', valeur: 0 } as Remise,
  acomptePourcent: 30,
  conditions: CONDITIONS,
  notes: '',
  modeleId: 'm-sobre',
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
    modeleId: 'm-bandeau',
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

// ---------- Magasin en mémoire ----------

function creerMagasin<T extends { id: string }>(initial: T[]) {
  let etat = initial
  const abonnes = new Set<() => void>()
  const abonner = (f: () => void) => {
    abonnes.add(f)
    return () => abonnes.delete(f)
  }
  const lire = () => etat
  return {
    useListe: () => useSyncExternalStore(abonner, lire),
    lire,
    /** Ajoute ou remplace l'élément de même id. */
    enregistrer(item: T) {
      etat = etat.some((e) => e.id === item.id)
        ? etat.map((e) => (e.id === item.id ? item : e))
        : [item, ...etat]
      abonnes.forEach((f) => f())
    },
    supprimer(id: string) {
      etat = etat.filter((e) => e.id !== id)
      abonnes.forEach((f) => f())
    },
  }
}

export const magasinDevis = creerMagasin<Devis>(DEVIS_DEMO)
export const magasinModeles = creerMagasin<ModeleDevis>(MODELES_DEMO)

export const modeleParDefaut = (modeles: readonly ModeleDevis[]): ModeleDevis =>
  modeles.find((m) => m.parDefaut) ?? modeles[0] ?? MODELES_DEMO[0]!

/** Prochain numéro de devis de la démo. */
export function prochainNumero(devis: readonly Devis[]): string {
  const max = Math.max(0, ...devis.map((d) => Number(d.numero.split('-').pop()) || 0))
  return `DEV-2026-${String(max + 1).padStart(4, '0')}`
}
