import type { Organisation } from '@shared/session'
import { DOCUMENT_EXEMPLE, type DocumentRendu, type EmetteurDocument, type MentionsLegales, type TypeDocument } from '../rendu'
import type { ReglagesDocuments } from '../api'

export type OrganisationDocument = Pick<
  Organisation,
  'nom' | 'formeJuridique' | 'siret' | 'tvaIntracom' | 'adresse' | 'codePostal' | 'ville' | 'email' | 'telephone'
>

const texte = (v: string | null | undefined) => v?.trim() ?? ''

/** Mentions que la session connaît déjà. IBAN, RCS, assurance… restent à saisir. */
export function mentionsDepuisOrganisation(o: OrganisationDocument): Pick<MentionsLegales, 'siret' | 'numeroTva' | 'formeJuridique'> {
  return { siret: texte(o.siret), numeroTva: texte(o.tvaIntracom), formeJuridique: texte(o.formeJuridique) }
}

/** Réglages enregistrés, complétés par l'organisation pour ce qui est vide. Une valeur saisie l'emporte. */
export function prerempliDepuisOrganisation(o: OrganisationDocument, enregistres: ReglagesDocuments): ReglagesDocuments {
  const connues = mentionsDepuisOrganisation(o)
  const mentions = { ...enregistres.mentions }
  for (const cle of Object.keys(connues) as (keyof typeof connues)[]) mentions[cle] = texte(mentions[cle]) || connues[cle]
  return { ...enregistres, mentions }
}

/** Adresse imprimée sur les documents ; vide tant que rue, code postal ou ville manque. */
export function adresseImprimee(o: Pick<OrganisationDocument, 'adresse' | 'codePostal' | 'ville'>): string {
  const [rue, cp, ville] = [texte(o.adresse), texte(o.codePostal), texte(o.ville)]
  return rue && cp && ville ? `${rue}, ${cp} ${ville}` : ''
}

export function emetteurDepuisOrganisation(o: OrganisationDocument): EmetteurDocument {
  return {
    nom: o.nom,
    activite: '',
    adresse: { rue: texte(o.adresse), codePostal: texte(o.codePostal), ville: texte(o.ville) },
    telephone: texte(o.telephone),
    email: texte(o.email),
  }
}

/**
 * Document d'exemple décliné par type. Seuls l'émetteur (la vraie organisation) et les réglages changent ;
 * les lignes et montants restent ceux de l'exemple (tous positifs : le rendu applique le signe de l'avoir).
 */
export function documentApercu(type: TypeDocument, o: OrganisationDocument, reglages: ReglagesDocuments): DocumentRendu {
  const base: DocumentRendu = {
    ...DOCUMENT_EXEMPLE,
    emetteur: emetteurDepuisOrganisation(o),
    mentions: reglages.mentions,
    textes: reglages.textes,
    conditionsPaiement: reglages.conditionsPaiement,
  }
  const { acompte, ...totauxSansAcompte } = DOCUMENT_EXEMPLE.totaux
  if (type === 'devis') return base
  if (type === 'facture') {
    const reste = Math.round((DOCUMENT_EXEMPLE.totaux.totalTtc - (acompte?.montant ?? 0)) * 100) / 100
    return { ...base, type, numero: 'FAC-2026-0018', referenceLiee: DOCUMENT_EXEMPLE.numero, bonPourAccord: undefined, totaux: { ...DOCUMENT_EXEMPLE.totaux, resteAPayer: reste } }
  }
  return { ...base, type, numero: 'AV-2026-0003', referenceLiee: 'FAC-2026-0018', bonPourAccord: undefined, dateEcheance: undefined, totaux: totauxSansAcompte }
}
