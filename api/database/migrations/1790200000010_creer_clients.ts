import { BaseSchema } from '@adonisjs/lucid/schema'

/** Module Clients : clients (portée organisation), adresses et contacts (portée via le client). */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('clients', (table) => {
      table.increments('id')
      table
        .integer('organisation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organisations')
        .onDelete('CASCADE')
      table.string('nature', 20).notNullable().defaultTo('particulier')
      table.string('nom', 150).notNullable()
      table.string('prenom', 100).nullable()
      table.string('email', 254).nullable()
      table.string('telephone', 30).nullable()
      table.string('siren', 9).nullable()
      table.string('siret', 14).nullable()
      table.string('tva_intracom', 20).nullable()
      table.text('notes').nullable()
      table.text('tags').notNullable()
      table.timestamp('archive_le').nullable()
      table.string('archive_motif', 255).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['organisation_id', 'nom'])
    })

    this.schema.createTable('adresses_clients', (table) => {
      table.increments('id')
      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('clients')
        .onDelete('CASCADE')
      table.string('libelle', 60).notNullable()
      table.string('ligne1', 255).notNullable()
      table.string('ligne2', 255).nullable()
      table.string('code_postal', 10).notNullable()
      table.string('ville', 100).notNullable()
      table.string('pays', 2).notNullable().defaultTo('FR')
      table.boolean('par_defaut').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('contacts_clients', (table) => {
      table.increments('id')
      table
        .integer('client_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('clients')
        .onDelete('CASCADE')
      table.string('nom', 150).notNullable()
      table.string('role', 80).nullable()
      table.string('email', 254).nullable()
      table.string('telephone', 30).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('contacts_clients')
    this.schema.dropTable('adresses_clients')
    this.schema.dropTable('clients')
  }
}
