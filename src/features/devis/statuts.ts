import type { NomIcone } from '@/ui/Icone'
import type { StatutDevis } from './types'

export const LIBELLES_STATUT_DEVIS: Record<StatutDevis, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
}

export const ICONE_STATUT_DEVIS: Record<StatutDevis, NomIcone> = {
  brouillon: 'crayon',
  envoye: 'envoyer',
  accepte: 'accepte',
  refuse: 'refuse',
  expire: 'horloge',
}

/** Un devis dans ces statuts n'est plus modifiable. */
export const STATUTS_FIGES: readonly StatutDevis[] = ['accepte', 'refuse', 'expire']
