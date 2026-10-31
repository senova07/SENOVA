import type { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { booleen } from '#models/colonnes'
import Membre from '#models/membre'

/**
 * Le hacheur est passé sous forme de fonction : le service `hash` ne reçoit sa
 * valeur qu'une fois l'application démarrée (commandes ace chargées avant).
 */
const AuthFinder = withAuthFinder(() => hash.use(), {
  uids: ['email'],
  passwordColumnName: 'motDePasse',
})

/**
 * Compte de connexion. Un utilisateur peut appartenir à plusieurs
 * organisations (voir `Membre`) : ses droits dépendent de l'organisation
 * courante, jamais du compte seul.
 */
export default class Utilisateur extends compose(BaseModel, AuthFinder) {
  static table = 'utilisateurs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare nomComplet: string

  @column({ serializeAs: null })
  declare motDePasse: string

  @column(booleen)
  declare actif: boolean

  /** Incrémentée à chaque changement de mot de passe : les anciennes sessions sont refusées. */
  @column()
  declare versionSession: number

  @column.dateTime()
  declare dernierAccesLe: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Membre)
  declare membres: HasMany<typeof Membre>
}
