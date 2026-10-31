import type { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { deLOrganisation } from '#models/portee'
import { prochainOrdre } from '#services/outils'

export default class CategorieArticle extends BaseModel {
  static table = 'categories_articles'

  static deLOrganisation = deLOrganisation

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organisationId: number

  @column()
  declare nom: string

  @column()
  declare ordre: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static async rangerALaSuite(categorie: CategorieArticle) {
    if (categorie.ordre) return
    categorie.ordre = await prochainOrdre(
      'categories_articles',
      categorie.organisationId,
      categorie.$trx
    )
  }
}
