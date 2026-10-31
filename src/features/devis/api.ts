import { aujourdhuiIso, copierDevis, nouvelId, numeroSuivant } from './calculs'
import { magasinDevis } from './magasin'
import type { Devis, StatutDevis } from './types'

/*
 * API des devis.
 * shortcut: démo en mémoire (perdue au rechargement), pas d'API devis côté serveur ;
 * chaque fonction a déjà la forme d'un appel HTTP (asynchrone, rejette si introuvable).
 * Les écrans n'appellent que `apiDevis`, jamais le magasin directement pour écrire.
 */

/** Remet le magasin de démo à zéro, à appeler au changement d'organisation. */
export const reinitialiserDemoDevis = (): void => magasinDevis.reinitialiser()

const introuvable = () => new Error('Devis introuvable')

export const apiDevis = {
  /** Vrai tant que l'enregistrement n'est pas branché sur l'API : l'interface doit le dire. */
  demo: true,

  /** GET /api/devis */
  lister: async (): Promise<Devis[]> => magasinDevis.lire(),

  /** GET /api/devis/:id */
  lire: async (id: string): Promise<Devis> => {
    const devis = magasinDevis.lire().find((d) => d.id === id)
    if (!devis) throw introuvable()
    return devis
  },

  /** GET /api/devis/prochain-numero */
  prochainNumero: async (): Promise<string> => numeroSuivant(magasinDevis.lire()),

  /** POST /api/devis : crée un brouillon vide (30 jours de validité), éventuellement prérempli. */
  creerBrouillon: async (initial: Partial<Devis> = {}): Promise<Devis> => {
    const brouillon: Devis = {
      id: nouvelId(),
      numero: numeroSuivant(magasinDevis.lire()),
      clientNom: '',
      clientAdresse: '',
      objet: '',
      statut: 'brouillon',
      dateCreation: aujourdhuiIso(),
      validiteJours: 30,
      lignes: [],
      remise: { mode: 'pourcent', valeur: 0 },
      acomptePourcent: 30,
      conditions: 'Acompte à la commande, solde à réception de facture',
      moyensPaiement: ['Virement bancaire'],
      notes: '',
      majLe: new Date().toISOString(),
      ...initial,
    }
    magasinDevis.enregistrer(brouillon)
    return brouillon
  },

  /** PUT /api/devis/:id : remplace le devis entier. */
  enregistrerBrouillon: async (devis: Devis): Promise<Devis> => {
    const enregistre = { ...devis, majLe: new Date().toISOString() }
    magasinDevis.enregistrer(enregistre)
    return enregistre
  },

  /** POST /api/devis/:id/dupliquer */
  dupliquer: async (id: string): Promise<Devis> => {
    const copie = copierDevis(await apiDevis.lire(id), magasinDevis.lire())
    magasinDevis.enregistrer(copie)
    return copie
  },

  /** POST /api/devis/:id/statut (marquer envoyé, accepté ou refusé à la main ; n'envoie rien). */
  changerStatut: async (id: string, statut: StatutDevis): Promise<Devis> => {
    const devis = await apiDevis.lire(id)
    const suivant: Devis = {
      ...devis,
      statut,
      envoyeLe: statut === 'envoye' ? aujourdhuiIso() : devis.envoyeLe,
      majLe: new Date().toISOString(),
    }
    magasinDevis.enregistrer(suivant)
    return suivant
  },

  /** DELETE /api/devis/:id */
  supprimer: async (id: string): Promise<void> => {
    magasinDevis.supprimer(id)
  },
}
