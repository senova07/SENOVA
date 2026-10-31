import type { DocumentRendu, LignePrestation, LigneSection } from './types'

const prestation = (
  id: string, designation: string, quantite: number, unite: string, prixUnitaireHt: number, tauxTva: number, reference: string,
): LignePrestation => ({
  type: 'prestation', id, designation, reference, quantite, unite, prixUnitaireHt, tauxTva, remisePct: 0,
  totalHt: Math.round(quantite * prixUnitaireHt * 100) / 100,
})
const section = (id: string, titre: string, totalHt: number): LigneSection => ({ type: 'section', id, titre, totalHt })

/**
 * Devis d'exemple (données de la maquette). Totaux écrits en dur : base 10 % = 630 €, base 20 % = 272 €,
 * soit HT 902 €, TVA 117,40 €, TTC 1 019,40 € ; acompte de 30 % = 305,82 €.
 */
export const DOCUMENT_EXEMPLE: DocumentRendu = {
  type: 'devis',
  numero: 'DEV-2026-0042',
  dateEmission: '2026-10-31',
  dateEcheance: '2026-11-30',
  emetteur: {
    nom: 'Atelier Martin',
    activite: 'Plomberie · Chauffage',
    adresse: { rue: '12 rue des Artisans', codePostal: '69003', ville: 'Lyon' },
    telephone: '04 78 12 34 56',
    email: 'contact@atelier-martin.fr',
  },
  client: { civilite: 'Mme', nom: 'Sophie Durand', adresse: { rue: '8 rue Paul Bert', codePostal: '69003', ville: 'Lyon' } },
  adresseChantier: { rue: '12 rue des Écoles', codePostal: '69003', ville: 'Lyon' },
  objet: 'Rénovation salle de bain',
  lignes: [
    section('s1', 'Salle de bain', 559),
    prestation('l1', 'Dépose ancienne installation', 1, 'forfait', 150, 10, 'SERV-030'),
    prestation('l2', 'Mitigeur thermostatique Grohe', 1, 'pièce', 189, 20, 'PR-014'),
    prestation('l3', 'Pose lavabo', 1, 'forfait', 220, 10, 'SERV-012'),
    section('s2', 'Raccordements', 343),
    prestation('l4', 'Heure de plomberie', 4, 'heure', 65, 10, 'MO-001'),
    prestation('l5', 'Forfait déplacement', 1, 'forfait', 35, 20, 'DEP-001'),
    prestation('l6', 'Fournitures de raccordement', 1, 'lot', 48, 20, 'PR-108'),
  ],
  totaux: {
    totalHt: 902,
    tva: [
      { taux: 10, base: 630, montant: 63 },
      { taux: 20, base: 272, montant: 54.4 },
    ],
    totalTva: 117.4,
    totalTtc: 1019.4,
    acompte: { pourcentage: 30, montant: 305.82 },
  },
  conditionsPaiement: 'Acompte à la commande, solde à réception de facture',
  moyensPaiement: ['Virement bancaire', 'Chèque', 'Espèces'],
  mentions: {
    siret: '812 345 678 00021',
    numeroTva: 'FR 32 812345678',
    formeJuridique: 'SARL',
    capital: '5 000 €',
    registre: 'RM Lyon 812 345 678',
    assureur: 'MAAF Pro',
    contratAssurance: '',
    zoneAssurance: 'France métropolitaine',
    iban: '',
    bic: '',
  },
  textes: {
    conditions: 'Devis gratuit. Les travaux débuteront après réception du devis signé et de l’acompte. Toute prestation supplémentaire fera l’objet d’un avenant.',
    remerciement: 'Merci pour votre confiance',
    validite: 'Ce devis est valable 30 jours à compter de sa date d’émission.',
    penalites: 'En cas de retard de paiement, des pénalités au taux de 3 fois le taux d’intérêt légal seront appliquées.',
    indemnite: 'Pour les clients professionnels : indemnité forfaitaire de 40 € pour frais de recouvrement.',
  },
  bonPourAccord: { mention: 'Date et signature du client, précédées de la mention « Bon pour accord »' },
}
