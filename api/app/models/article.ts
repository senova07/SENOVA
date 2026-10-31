import type { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { booleen, decimal } from '#models/colonnes'
import { deLOrganisation } from '#models/portee'
import { prochainOrdre } from '#services/outils'
import type { TypeArticle } from '#shared/articles'

/** Une ligne de la mémoire commerciale : ce que l'entreprise vend, et à quel prix. */
export default class Article extends BaseModel {
  static table = 'articles'

  static deLOrganisation = deLOrganisation

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organisationId: number

  @column()
  declare reference: string | null

  @column()
  declare nom: string

  @column()
  declare description: string | null

  @column()
  declare type: TypeArticle

  @column()
  declare unite: string

  @column(decimal)
  declare prixUnitaireHt: number

  @column(decimal)
  declare tauxTva: number

  @column(decimal)
  declare prixAchatHt: number | null

  @column()
  declare categorieId: number | null

  @column(booleen)
  declare favori: boolean

  @column(booleen)
  declare actif: boolean

  @column()
  declare ordre: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /** Un nouvel article se range à la suite des autres de son organisation. */
  @beforeCreate()
  static async rangerALaSuite(article: Article) {
    if (article.ordre) return
    article.ordre = await prochainOrdre('articles', article.organisationId, article.$trx)
  }
}
