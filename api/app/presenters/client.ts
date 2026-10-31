import type AdresseClientModele from '#models/adresse_client'
import type ClientModele from '#models/client'
import type ContactClientModele from '#models/contact_client'
import type { AdresseClient, Client, ContactClient } from '#shared/clients'

export function presenterAdresse(a: AdresseClientModele): AdresseClient {
  return {
    id: String(a.id),
    libelle: a.libelle,
    ligne1: a.ligne1,
    ligne2: a.ligne2,
    codePostal: a.codePostal,
    ville: a.ville,
    pays: a.pays,
    parDefaut: a.parDefaut,
  }
}

export function presenterContact(c: ContactClientModele): ContactClient {
  return { id: String(c.id), nom: c.nom, role: c.role, email: c.email, telephone: c.telephone }
}

/** Adresses et contacts ne sont inclus que s'ils ont été préchargés. */
export function presenterClient(c: ClientModele): Client {
  return {
    id: String(c.id),
    nature: c.nature,
    nom: c.nom,
    prenom: c.prenom,
    email: c.email,
    telephone: c.telephone,
    siren: c.siren,
    siret: c.siret,
    tvaIntracom: c.tvaIntracom,
    tags: c.tags,
    archiveLe: c.archiveLe?.toISO() ?? null,
    createdAt: c.createdAt.toISO()!,
    // Notes et motif d'archivage : fiche seulement (adresses préchargées), pas la liste.
    ...(c.$preloaded.adresses ? { notes: c.notes, archiveMotif: c.archiveMotif } : {}),
    ...(c.$preloaded.adresses ? { adresses: c.adresses.map(presenterAdresse) } : {}),
    ...(c.$preloaded.contacts ? { contacts: c.contacts.map(presenterContact) } : {}),
  }
}
