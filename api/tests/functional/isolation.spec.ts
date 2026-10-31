import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import IntrouvableException from '#exceptions/introuvable_exception'
import Role from '#models/role'
import { trouverDansOrganisation } from '#services/acces'
import { creerCompte } from '#tests/aides'

/**
 * Isolation générique : `Role` sert de modèle témoin, il porte `organisation_id`
 * comme tout futur modèle métier. Le même test vaut pour Client, Article...
 */
test.group('Isolation entre organisations', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('trouverDansOrganisation : trouve le sien, 404 pour celui d une autre organisation', async ({
    assert,
  }) => {
    const { organisation: a } = await creerCompte('A')
    const { organisation: b } = await creerCompte('B')
    const roleA = await Role.query().where('organisation_id', a.id).firstOrFail()
    const roleB = await Role.query().where('organisation_id', b.id).firstOrFail()

    assert.equal((await trouverDansOrganisation(Role, String(roleA.id), a.id)).id, roleA.id)

    for (const id of [String(roleB.id), 'abc', '0', '-1', undefined, '99999999']) {
      await assert.rejects(
        () => trouverDansOrganisation(Role, id, a.id),
        new IntrouvableException().message
      )
    }
  })

  test('scope deLOrganisation : ne liste que les lignes de l organisation', async ({ assert }) => {
    const { organisation: a } = await creerCompte('A')
    await creerCompte('B')
    const roles = await Role.query().withScopes((s) => s.deLOrganisation(a.id))
    assert.lengthOf(roles, 4)
    assert.isTrue(roles.every((r) => r.organisationId === a.id))
  })
})
