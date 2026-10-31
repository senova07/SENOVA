import type { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { booleen } from '#models/colonnes'
import Organisation from '#models/organisation'
import { deLOrganisation } from '#models/portee'
import Role from '#models/role'
import Utilisateur from '#models/utilisateur'

/** Appartenance d'un utilisateur à une organisation, avec son rôle. */
export default class Membre extends BaseModel {
  static table = 'membres'

  static deLOrganisation = deLOrganisation

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organisationId: number

  @column()
  declare utilisateurId: number

  @column()
  declare roleId: number

  @column(booleen)
  declare actif: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Organisation)
  declare organisation: BelongsTo<typeof Organisation>

  @belongsTo(() => Utilisateur)
  declare utilisateur: BelongsTo<typeof Utilisateur>

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>
}
