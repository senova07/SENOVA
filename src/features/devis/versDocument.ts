import type {
  AdresseDocument,
  ClientDocument,
  DocumentRendu,
  EmetteurDocument,
  LigneDocument,
  MentionsLegales,
} from '@/features/documents'
import type { Organisation } from '@shared/session'
import { dateFinValidite, sousTotalSection, totalLigneHt, totauxDevis } from './calculs'
import type { Devis } from './types'

/** « 8 rue Paul Bert\n69003 Lyon » → rue + code postal + ville (dernière ligne lue comme « 69003 Lyon »). */
export function adresseDepuisTexte(texte: string): AdresseDocument {
  const lignes = texte.split('\n').map((l) => l.trim()).filter(Boolean)
  const derniere = lignes.length > 1 ? lignes[lignes.length - 1]! : ''
  const m = /^(\d{4,5})\s+(.+)$/.exec(derniere)
  if (!m) return { rue: lignes.join(', '), codePostal: '', ville: '' }
  return { rue: lignes.slice(0, -1).join(', '), codePostal: m[1]!, ville: m[2]! }
}

function emetteurDocument(o: Organisation | null): EmetteurDocument {
  return {
    nom: o?.nom ?? '',
    activite: o?.formeJuridique ?? '',
    adresse: { rue: o?.adresse ?? '', codePostal: o?.codePostal ?? '', ville: o?.ville ?? '' },
    telephone: o?.telephone ?? '',
    email: o?.email ?? '',
  }
}

/** Seules les mentions connues de l'organisation sont remplies ; le reste attend les paramètres de l'entreprise. */
function mentionsDocument(o: Organisation | null): MentionsLegales {
  return {
    siret: o?.siret ?? '',
    numeroTva: o?.tvaIntracom ?? '',
    formeJuridique: o?.formeJuridique ?? '',
    capital: '',
    registre: '',
    assureur: '',
    contratAssurance: '',
    zoneAssurance: '',
    iban: '',
    bic: '',
  }
}

/** Devis + émetteur (organisation de la session) → document prêt à afficher. Les totaux viennent de `calculs`. */
export function versDocument(devis: Devis, organisation: Organisation | null): DocumentRendu {
  const totaux = totauxDevis(devis)
  const lignes: LigneDocument[] = devis.lignes.map((l, i) => {
    if (l.genre === 'section') {
      return { type: 'section', id: l.id, titre: l.designation, totalHt: sousTotalSection(devis.lignes, i) }
    }
    if (l.genre === 'texte') return { type: 'texte', id: l.id, texte: l.designation }
    return {
      type: 'prestation',
      id: l.id,
      designation: l.designation,
      reference: l.reference,
      quantite: l.quantite,
      unite: l.unite,
      prixUnitaireHt: l.prixUnitaireHt,
      tauxTva: l.tauxTva,
      remisePct: l.remisePourcent,
      totalHt: totalLigneHt(l),
    }
  })
  const client: ClientDocument | null = devis.clientNom
    ? { nom: devis.clientNom, adresse: adresseDepuisTexte(devis.clientAdresse) }
    : null

  return {
    type: 'devis',
    numero: devis.numero,
    dateEmission: devis.dateCreation,
    dateEcheance: dateFinValidite(devis),
    emetteur: emetteurDocument(organisation),
    client,
    adresseChantier: devis.adresseChantier,
    objet: devis.objet || undefined,
    lignes,
    texteLibre: devis.notes || undefined,
    totaux: {
      totalHt: totaux.totalHt,
      sousTotalHt: totaux.totalHtBrut,
      remise: totaux.remiseMontant,
      tva: totaux.tva,
      totalTva: totaux.totalTva,
      totalTtc: totaux.totalTtc,
      acompte:
        devis.acomptePourcent > 0
          ? { pourcentage: devis.acomptePourcent, montant: totaux.acompte }
          : undefined,
    },
    conditionsPaiement: devis.conditions,
    moyensPaiement: devis.moyensPaiement,
    mentions: mentionsDocument(organisation),
    textes: {
      conditions: '',
      remerciement: '',
      validite: `Ce devis est valable ${devis.validiteJours} jours à compter de sa date d’émission.`,
      penalites: '',
      indemnite: '',
    },
    bonPourAccord: { mention: 'Date et signature du client, précédées de la mention « Bon pour accord »' },
  }
}
