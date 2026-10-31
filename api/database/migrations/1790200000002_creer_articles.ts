import { BaseSchema } from '@adonisjs/lucid/schema'

/** Mémoire commerciale : catégories facultatives et articles, par organisation. */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('categories_articles', (table) => {
      table.increments('id')
      table
        .integer('organisation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organisations')
        .onDelete('CASCADE')
      // La collation MariaDB par défaut est insensible à la casse : l'unicité l'est donc aussi.
      table.string('nom', 80).notNullable()
      table.integer('ordre').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['organisation_id', 'nom'])
    })

    this.schema.createTable('articles', (table) => {
      table.increments('id')
      table
        .integer('organisation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organisations')
        .onDelete('CASCADE')
      table.string('reference', 60).nullable()
      table.string('nom', 200).notNullable()
      table.text('description').nullable()
      table.string('type', 20).notNullable().defaultTo('service')
      table.string('unite', 30).notNullable().defaultTo('u')
      table.decimal('prix_unitaire_ht', 12, 2).notNullable().defaultTo(0)
      table.decimal('taux_tva', 5, 2).notNullable().defaultTo(20)
      table.decimal('prix_achat_ht', 12, 2).nullable()
      table
        .integer('categorie_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('categories_articles')
        .onDelete('SET NULL')
      table.boolean('favori').notNullable().defaultTo(false)
      table.boolean('actif').notNullable().defaultTo(true)
      table.integer('ordre').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      // NULL multiples autorisés : unique seulement si la référence est renseignée.
      table.unique(['organisation_id', 'reference'])
      table.index(['organisation_id', 'ordre'])
    })
  }

  async down() {
    this.schema.dropTable('articles')
    this.schema.dropTable('categories_articles')
  }
}
