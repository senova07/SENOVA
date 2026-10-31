import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Portée via le client : toujours charger le client dans l'organisation d'abord. */
export default class ContactClient extends BaseModel {
  static table = 'contacts_clients'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clientId: number

  @column()
  declare nom: string

  @column()
  declare role: string | null

  @column()
  declare email: string | null

  @column()
  declare telephone: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
