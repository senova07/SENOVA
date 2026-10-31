import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import RegleMetierException from '#exceptions/regle_metier_exception'
import AdresseClient from '#models/adresse_client'
import Client from '#models/client'
import ContactClient from '#models/contact_client'
import { trouverDansOrganisation } from '#services/acces'
import { echapperLike } from '#services/outils'
import type { ClientSaisie } from '#shared/clients'

/** Client de l'organisation (404 sinon), avec adresses et contacts. */
export async function ficheClient(id: string, organisationId: number): Promise<Client> {
  const client = await trouverDansOrganisation(Client, id, organisationId)
  await client.load('adresses', (r) => r.orderBy('id'))
  await client.load('contacts', (r) => r.orderBy('id'))
  return client
}

export async function listerClients(
  organisationId: number,
  f: { recherche?: string; archives?: '0' | '1'; page?: number; parPage?: number }
) {
  const page = f.page ?? 1
  const parPage = f.parPage ?? 25
  const resultat = await Client.query()
    .withScopes((s) => s.deLOrganisation(organisationId))
    .if(f.archives === '1', (q) => q.whereNotNull('archive_le'))
    .if(f.archives !== '1', (q) => q.whereNull('archive_le'))
    .if(f.recherche, (q) => {
      const motif = `%${echapperLike(f.recherche!)}%`
      q.where((w) => {
        for (const colonne of ['nom', 'prenom', 'email', 'telephone', 'siret']) {
          w.orWhere(colonne, 'like', motif)
        }
        w.orWhereIn(
          'id',
          db.from('adresses_clients').select('client_id').where('ville', 'like', motif)
        )
      })
    })
    .orderBy('nom')
    .orderBy('id')
    .paginate(page, parPage)
  return { clients: resultat.all(), total: resultat.total, page, parPage }
}

/** Adresses : au plus une par défaut ; la première si aucune n'est marquée. */
function adressesNormalisees(adresses: NonNullable<ClientSaisie['adresses']>) {
  const indice = Math.max(
    adresses.findIndex((a) => a.parDefaut),
    0
  )
  return adresses.map((a, i) => ({ ...a, pays: a.pays ?? 'FR', parDefaut: i === indice }))
}

async function remplacerEnfants(
  client: Client,
  saisie: ClientSaisie,
  trx: TransactionClientContract
) {
  if (saisie.adresses) {
    await AdresseClient.query({ client: trx }).where('client_id', client.id).delete()
    await AdresseClient.createMany(
      adressesNormalisees(saisie.adresses).map((a) => ({ ...a, clientId: client.id })),
      { client: trx }
    )
  }
  if (saisie.contacts) {
    await ContactClient.query({ client: trx }).where('client_id', client.id).delete()
    await ContactClient.createMany(
      saisie.contacts.map((c) => ({ ...c, clientId: client.id })),
      { client: trx }
    )
  }
}

function champs(saisie: ClientSaisie) {
  const reste: Partial<ClientSaisie> = { ...saisie }
  delete reste.adresses
  delete reste.contacts
  return { ...reste, tags: [...new Set(saisie.tags ?? [])] }
}

export async function creerClient(organisationId: number, saisie: ClientSaisie) {
  const id = await db.transaction(async (trx) => {
    const client = await Client.create({ ...champs(saisie), organisationId }, { client: trx })
    await remplacerEnfants(client, saisie, trx)
    return client.id
  })
  return ficheClient(String(id), organisationId)
}

/** PUT : remplace les champs (absent = vidé) ; adresses/contacts fournis remplacent les existants. */
export async function modifierClient(id: string, organisationId: number, saisie: ClientSaisie) {
  const client = await trouverDansOrganisation(Client, id, organisationId)
  await db.transaction(async (trx) => {
    client.useTransaction(trx)
    client.merge({
      prenom: null,
      email: null,
      telephone: null,
      siren: null,
      siret: null,
      tvaIntracom: null,
      notes: null,
      ...champs(saisie),
    })
    await client.save()
    await remplacerEnfants(client, saisie, trx)
  })
  return ficheClient(id, organisationId)
}

export async function archiverClient(id: string, organisationId: number, motif?: string | null) {
  const client = await trouverDansOrganisation(Client, id, organisationId)
  if (client.archiveLe) throw new RegleMetierException('Ce client est déjà archivé.')
  client.merge({ archiveLe: DateTime.now(), archiveMotif: motif ?? null })
  await client.save()
  return ficheClient(id, organisationId)
}

export async function restaurerClient(id: string, organisationId: number) {
  const client = await trouverDansOrganisation(Client, id, organisationId)
  if (!client.archiveLe) throw new RegleMetierException("Ce client n'est pas archivé.")
  client.merge({ archiveLe: null, archiveMotif: null })
  await client.save()
  return ficheClient(id, organisationId)
}

/**
 * shortcut: aucun module devis/factures n'existe encore, donc toujours 0. À brancher
 * sur les tables devis/factures (comptage par client_id) à leur création.
 */
export async function documentsLegauxLies(_clientId: number): Promise<number> {
  return 0
}

export async function supprimerClient(id: string, organisationId: number) {
  const client = await trouverDansOrganisation(Client, id, organisationId)
  if ((await documentsLegauxLies(client.id)) > 0) {
    throw new RegleMetierException(
      'Ce client a des documents légaux liés : archivez-le plutôt que de le supprimer.'
    )
  }
  await client.delete() // adresses et contacts partent en cascade (FK)
}
