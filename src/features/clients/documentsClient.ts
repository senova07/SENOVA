import { FACTURES_DEMO, totalTtcDevis, type Devis, type FactureDemo } from '@/features/devis'
import { sansAccent } from '@/lib/texte'
import { nomAffichageClient, type Client } from '@shared/clients'

/** Maquette : les pièces de vente sont rattachées au client par son nom affiché. */
const memeClient = (c: Client, nom: string) => sansAccent(nom) === sansAccent(nomAffichageClient(c))

export const facturesDuClient = (c: Client): FactureDemo[] =>
  FACTURES_DEMO.filter((f) => memeClient(c, f.clientNom))

export const resteDuClient = (c: Client): number =>
  facturesDuClient(c).reduce((somme, f) => somme + f.resteDu, 0)

export function documentsClient(c: Client, tousLesDevis: readonly Devis[]) {
  const devis = tousLesDevis.filter((d) => memeClient(c, d.clientNom))
  const factures = facturesDuClient(c)
  const facture = factures.reduce((s, f) => s + f.montantTtc, 0)
  const resteDu = factures.reduce((s, f) => s + f.resteDu, 0)
  return {
    devis,
    factures,
    totaux: {
      // Un brouillon n'est pas encore une proposition faite au client.
      devise: devis.filter((d) => d.statut !== 'brouillon').reduce((s, d) => s + totalTtcDevis(d), 0),
      facture,
      encaisse: facture - resteDu,
      resteDu,
    },
  }
}
