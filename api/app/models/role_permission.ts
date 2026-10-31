import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RolePermission extends BaseModel {
  static table = 'role_permissions'

  @column()
  declare roleId: number

  @column()
  declare permission: string
}
