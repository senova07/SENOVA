import type { NomIcone } from '@/components/ui/Icone'

export interface EtapeRuban {
  id: string
  libelle: string
  icone: NomIcone
}

/** Parcours métier SENOVA : du client au paiement. */
export const ETAPES_PARCOURS: readonly EtapeRuban[] = [
  { id: 'client', libelle: 'Client', icone: 'clients' },
  { id: 'devis', libelle: 'Devis', icone: 'devis' },
  { id: 'prestation', libelle: 'Prestation', icone: 'prestations' },
  { id: 'facture', libelle: 'Facture', icone: 'factures' },
  { id: 'paiement', libelle: 'Paiement', icone: 'paiements' },
]
