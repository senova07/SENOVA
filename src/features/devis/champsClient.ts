import { nomAffichageClient, type Client } from '@shared/clients'
import type { Devis } from './types'

/** Copie figée de la fiche client dans le devis : nom, adresse par défaut (une ligne par partie), courriel, téléphone. */
export function champsClient(c: Client): Partial<Devis> {
  const a = c.adresses?.find((x) => x.parDefaut) ?? c.adresses?.[0]
  return {
    clientId: c.id,
    clientNom: nomAffichageClient(c),
    clientAdresse: a
      ? [a.ligne1, a.ligne2, `${a.codePostal} ${a.ville}`.trim()].filter(Boolean).join('\n')
      : '',
    clientEmail: c.email ?? undefined,
    clientTelephone: c.telephone ?? undefined,
  }
}

/** Initiales d'un nom pour l'avatar. */
export const initiales = (nom: string): string =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join('')
    .toUpperCase()
