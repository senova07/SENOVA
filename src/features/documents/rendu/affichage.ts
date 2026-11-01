import { formaterEuro } from '../../../lib/format'
import type { DocumentRendu, TypeDocument } from './types'

/** Un avoir s'affiche en négatif ; on évite « -0,00 € ». */
export const formaterMontantDocument = (type: TypeDocument, montant: number): string =>
  formaterEuro(type === 'avoir' && montant !== 0 ? -montant : montant)


export const formaterQuantite = (q: number): string => String(q).replace('.', ',')

export const formaterDate = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const TITRES: Record<TypeDocument, string> = { devis: 'Devis', facture: 'Facture', avoir: 'Avoir' }

/** Titre et lignes d'information (dates, référence) selon le type de document. */
export function metaDocument(doc: DocumentRendu): { titre: string; lignes: [string, string][] } {
  const lignes: [string, string][] = [['Date', formaterDate(doc.dateEmission)]]
  if (doc.dateEcheance) lignes.push([doc.type === 'facture' ? 'Échéance' : 'Valable jusqu’au', formaterDate(doc.dateEcheance)])
  if (doc.referenceLiee) lignes.push([doc.type === 'avoir' ? 'Sur facture' : 'Devis', doc.referenceLiee])
  return { titre: TITRES[doc.type], lignes }
}

export const libelleClient = (document: DocumentRendu): string => (document.type === 'devis' ? 'Client' : 'Facturé à')
