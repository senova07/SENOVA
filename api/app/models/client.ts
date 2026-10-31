import type { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import AdresseClient from '#models/adresse_client'
import { json } from '#models/colonnes'
import ContactClient from '#models/contact_client'
import { deLOrganisation } from '#models/portee'
import type { NatureClient } from '#shared/clients'

export default class Client extends BaseModel {
  static table = 'clients'

  static deLOrganisation = deLOrganisation

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organisationId: number

  @column()
  declare nature: NatureClient

  @column()
  declare nom: string

  @column()
  declare prenom: string | null

  @column()
  declare email: string | null

  @column()
  declare telephone: string | null

  @column()
  declare siren: string | null

  @column()
  declare siret: string | null

  @column()
  declare tvaIntracom: string | null

  @column()
  declare notes: string | null

  @column(json<string[]>([]))
  declare tags: string[]

  @column.dateTime()
  declare archiveLe: DateTime | null

  @column()
  declare archiveMotif: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => AdresseClient)
  declare adresses: HasMany<typeof AdresseClient>

  @hasMany(() => ContactClient)
  declare contacts: HasMany<typeof ContactClient>
}
