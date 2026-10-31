import type { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { booleen } from '#models/colonnes'
import Organisation from '#models/organisation'
import { deLOrganisation } from '#models/portee'
import RolePermission from '#models/role_permission'
import { PERMISSIONS, estPermission, type Permission } from '#shared/permissions'

/**
 * Rôle d'une organisation : un nom et les permissions qu'il accorde.
 * Chaque organisation possède les siens (copiés des rôles par défaut).
 */
export default class Role extends BaseModel {
  static table = 'roles'

  static deLOrganisation = deLOrganisation

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organisationId: number

  @column()
  declare nom: string

  @column()
  declare description: string

  /** Accorde toutes les permissions. */
  @column(booleen)
  declare proprietaire: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Organisation)
  declare organisation: BelongsTo<typeof Organisation>

  @hasMany(() => RolePermission)
  declare permissions: HasMany<typeof RolePermission>

  /** Permissions effectives. Suppose `permissions` préchargé. */
  get permissionsAccordees(): Permission[] {
    if (this.proprietaire) return [...PERMISSIONS]
    const accordees = new Set(
      (this.permissions ?? []).map((ligne) => ligne.permission).filter(estPermission)
    )
    return PERMISSIONS.filter((cle) => accordees.has(cle))
  }
}
