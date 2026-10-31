import type { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Membre from '#models/membre'
import Role from '#models/role'

export default class Organisation extends BaseModel {
  static table = 'organisations'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nom: string

  @column()
  declare formeJuridique: string | null

  @column()
  declare siren: string | null

  @column()
  declare siret: string | null

  @column()
  declare tvaIntracom: string | null

  @column()
  declare adresse: string | null

  @column()
  declare codePostal: string | null

  @column()
  declare ville: string | null

  @column()
  declare pays: string

  @column()
  declare email: string | null

  @column()
  declare telephone: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Role)
  declare roles: HasMany<typeof Role>

  @hasMany(() => Membre)
  declare membres: HasMany<typeof Membre>
}
