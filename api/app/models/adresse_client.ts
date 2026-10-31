import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { booleen } from '#models/colonnes'

/** Portée via le client : toujours charger le client dans l'organisation d'abord. */
export default class AdresseClient extends BaseModel {
  static table = 'adresses_clients'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare clientId: number

  @column()
  declare libelle: string

  @column({ columnName: 'ligne1' })
  declare ligne1: string

  @column({ columnName: 'ligne2' })
  declare ligne2: string | null

  @column()
  declare codePostal: string

  @column()
  declare ville: string

  @column()
  declare pays: string

  @column(booleen)
  declare parDefaut: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
