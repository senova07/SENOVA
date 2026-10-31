import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Socle multi-organisations : organisations, comptes, rôles (propres à chaque
 * organisation), permissions des rôles et appartenances (membres).
 *
 * Toute table métier à venir portera `organisation_id` (FK, NOT NULL, indexée).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('organisations', (table) => {
      table.increments('id')
      table.string('nom', 150).notNullable()
      table.string('forme_juridique', 60).nullable()
      table.string('siren', 9).nullable()
      table.string('siret', 14).nullable()
      table.string('tva_intracom', 20).nullable()
      table.string('adresse', 255).nullable()
      table.string('code_postal', 10).nullable()
      table.string('ville', 100).nullable()
      table.string('pays', 2).notNullable().defaultTo('FR')
      table.string('email', 254).nullable()
      table.string('telephone', 30).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('utilisateurs', (table) => {
      table.increments('id')
      table.string('email', 254).notNullable().unique()
      table.string('nom_complet', 120).notNullable()
      /** Empreinte scrypt : le mot de passe en clair n'est jamais stocké. */
      table.string('mot_de_passe', 255).notNullable()
      table.boolean('actif').notNullable().defaultTo(true)
      /** Invalide les sessions ouvertes quand le mot de passe change. */
      table.integer('version_session').unsigned().notNullable().defaultTo(1)
      table.timestamp('dernier_acces_le').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('roles', (table) => {
      table.increments('id')
      table
        .integer('organisation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organisations')
        .onDelete('CASCADE')
      table.string('nom', 80).notNullable()
      table.string('description', 255).notNullable().defaultTo('')
      table.boolean('proprietaire').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['organisation_id', 'nom'])
    })

    this.schema.createTable('role_permissions', (table) => {
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')
      table.string('permission', 80).notNullable()
      table.primary(['role_id', 'permission'])
    })

    this.schema.createTable('membres', (table) => {
      table.increments('id')
      table
        .integer('organisation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organisations')
        .onDelete('CASCADE')
      table
        .integer('utilisateur_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('utilisateurs')
        .onDelete('CASCADE')
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('RESTRICT')
      table.boolean('actif').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['organisation_id', 'utilisateur_id'])
    })
  }

  async down() {
    this.schema.dropTable('membres')
    this.schema.dropTable('role_permissions')
    this.schema.dropTable('roles')
    this.schema.dropTable('utilisateurs')
    this.schema.dropTable('organisations')
  }
}
