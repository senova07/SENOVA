import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Client from '#models/client'
import { nomAffichageClient } from '#shared/clients'
import { ajouterMembre, creerCompte, session } from '#tests/aides'

const SAISIE = {
  nature: 'entreprise',
  nom: 'Dupont BTP',
  email: ' Contact@Dupont.fr ',
  siret: '12345678901234',
  tags: ['vip', 'vip', 'btp'],
  adresses: [
    { libelle: 'Facturation', ligne1: '1 rue A', codePostal: '75001', ville: 'Paris' },
    { libelle: 'Chantier', ligne1: '2 rue B', codePostal: '69001', ville: 'Lyon', parDefaut: true },
  ],
  contacts: [{ nom: 'Léa', role: 'comptabilité' }],
}

test.group('Clients', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('nomAffichageClient', ({ assert }) => {
    assert.equal(
      nomAffichageClient({ nature: 'particulier', nom: 'Martin', prenom: 'Zoé' }),
      'Zoé Martin'
    )
    assert.equal(nomAffichageClient({ nature: 'entreprise', nom: 'ACME', prenom: null }), 'ACME')
  })

  test('CRUD complet avec adresses et contacts', async ({ client, assert }) => {
    const { utilisateur, organisation } = await creerCompte()
    const s = session(utilisateur, organisation)

    const cree = await client.post('/api/clients').loginAs(utilisateur).withSession(s).json(SAISIE)
    cree.assertStatus(201)
    const c = cree.body()
    assert.equal(c.email, 'contact@dupont.fr')
    assert.deepEqual(c.tags, ['vip', 'btp'])
    assert.lengthOf(c.adresses, 2)
    assert.deepEqual(
      c.adresses.map((a: any) => a.parDefaut),
      [false, true]
    )
    assert.equal(c.adresses[0].pays, 'FR')
    assert.isString(c.id)

    const lu = await client.get(`/api/clients/${c.id}`).loginAs(utilisateur).withSession(s)
    lu.assertStatus(200)
    assert.lengthOf(lu.body().contacts, 1)

    const modifie = await client
      .put(`/api/clients/${c.id}`)
      .loginAs(utilisateur)
      .withSession(s)
      .json({ nature: 'entreprise', nom: 'Dupont SA', adresses: [SAISIE.adresses[0]] })
    modifie.assertStatus(200)
    assert.equal(modifie.body().nom, 'Dupont SA')
    assert.isNull(modifie.body().siret)
    assert.lengthOf(modifie.body().adresses, 1)
    assert.lengthOf(modifie.body().contacts, 1) // non fournis : conservés

    const supprime = await client.delete(`/api/clients/${c.id}`).loginAs(utilisateur).withSession(s)
    supprime.assertStatus(204)
    assert.isNull(await Client.find(Number(c.id)))
  })

  test('validation : SIRET invalide, nature inconnue', async ({ client }) => {
    const { utilisateur, organisation } = await creerCompte()
    const s = session(utilisateur, organisation)
    for (const mauvais of [
      { siret: '123' },
      { siren: '12' },
      { nature: 'autre' },
      { email: 'x' },
    ]) {
      const r = await client
        .post('/api/clients')
        .loginAs(utilisateur)
        .withSession(s)
        .json({ nature: 'particulier', nom: 'X', ...mauvais })
      r.assertStatus(422)
    }
  })

  test('recherche, pagination et archives', async ({ client, assert }) => {
    const { utilisateur, organisation } = await creerCompte()
    const s = session(utilisateur, organisation)
    const creer = (corps: object) =>
      client.post('/api/clients').loginAs(utilisateur).withSession(s).json(corps)
    await creer({ nature: 'particulier', nom: 'Martin', prenom: 'Zoé', telephone: '0600000001' })
    const dup = (await creer(SAISIE)).body()
    await creer({ nature: 'particulier', nom: 'Autre' })

    const chercher = async (q: string) =>
      (await client.get(`/api/clients?${q}`).loginAs(utilisateur).withSession(s)).body()

    assert.equal((await chercher('recherche=zoé')).total, 1)
    assert.equal((await chercher('recherche=0600000001')).total, 1)
    assert.equal((await chercher('recherche=Lyon')).donnees[0].nom, 'Dupont BTP')
    assert.equal((await chercher('recherche=12345678901234')).total, 1)
    assert.equal((await chercher('recherche=contact@dupont')).total, 1)
    const page = await chercher('parPage=2&page=2')
    assert.equal(page.total, 3)
    assert.lengthOf(page.donnees, 1)

    const arch = await client
      .post(`/api/clients/${dup.id}/archiver`)
      .loginAs(utilisateur)
      .withSession(s)
      .json({ motif: 'Inactif' })
    arch.assertStatus(200)
    assert.equal(arch.body().archiveMotif, 'Inactif')
    const liste = await chercher('archives=1')
    assert.notProperty(liste.donnees[0], 'notes')
    assert.notProperty(liste.donnees[0], 'archiveMotif')
    assert.equal((await chercher('')).total, 2)
    assert.equal((await chercher('archives=1')).total, 1)
    ;(
      await client
        .post(`/api/clients/${dup.id}/archiver`)
        .loginAs(utilisateur)
        .withSession(s)
        .json({})
    ).assertStatus(422)

    const rest = await client
      .post(`/api/clients/${dup.id}/restaurer`)
      .loginAs(utilisateur)
      .withSession(s)
    rest.assertStatus(200)
    assert.isNull(rest.body().archiveLe)
    assert.equal((await chercher('')).total, 3)
  })

  test('permissions : Comptable lit mais ne gère pas', async ({ client }) => {
    const { utilisateur: proprio, organisation } = await creerCompte()
    const { utilisateur: comptable } = await creerCompte('Autre')
    await ajouterMembre(comptable, organisation, 'Comptable')
    const sp = session(proprio, organisation)
    const sc = session(comptable, organisation)
    const c = (
      await client.post('/api/clients').loginAs(proprio).withSession(sp).json(SAISIE)
    ).body()

    ;(await client.get('/api/clients').loginAs(comptable).withSession(sc)).assertStatus(200)
    ;(await client.get(`/api/clients/${c.id}`).loginAs(comptable).withSession(sc)).assertStatus(200)
    ;(
      await client.post('/api/clients').loginAs(comptable).withSession(sc).json(SAISIE)
    ).assertStatus(403)
    ;(
      await client.put(`/api/clients/${c.id}`).loginAs(comptable).withSession(sc).json(SAISIE)
    ).assertStatus(403)
    ;(
      await client.post(`/api/clients/${c.id}/archiver`).loginAs(comptable).withSession(sc).json({})
    ).assertStatus(403)
    ;(await client.delete(`/api/clients/${c.id}`).loginAs(comptable).withSession(sc)).assertStatus(
      403
    )
    ;(await client.get('/api/clients')).assertStatus(401)
  })

  test('isolation : l organisation B ne voit ni ne touche les clients de A', async ({
    client,
    assert,
  }) => {
    const { utilisateur: a, organisation: orgA } = await creerCompte('A')
    const { utilisateur: b, organisation: orgB } = await creerCompte('B')
    const sa = session(a, orgA)
    const sb = session(b, orgB)
    const c = (await client.post('/api/clients').loginAs(a).withSession(sa).json(SAISIE)).body()

    const liste = await client.get('/api/clients').loginAs(b).withSession(sb)
    assert.equal(liste.body().total, 0)
    assert.equal(
      (await client.get('/api/clients?recherche=Dupont').loginAs(b).withSession(sb)).body().total,
      0
    )
    ;(await client.get(`/api/clients/${c.id}`).loginAs(b).withSession(sb)).assertStatus(404)
    ;(
      await client.put(`/api/clients/${c.id}`).loginAs(b).withSession(sb).json(SAISIE)
    ).assertStatus(404)
    ;(
      await client.post(`/api/clients/${c.id}/archiver`).loginAs(b).withSession(sb).json({})
    ).assertStatus(404)
    ;(await client.post(`/api/clients/${c.id}/restaurer`).loginAs(b).withSession(sb)).assertStatus(
      404
    )
    ;(await client.delete(`/api/clients/${c.id}`).loginAs(b).withSession(sb)).assertStatus(404)

    const intact = await Client.findOrFail(Number(c.id))
    assert.equal(intact.nom, 'Dupont BTP')
    assert.isNull(intact.archiveLe)
    assert.equal(intact.organisationId, orgA.id)

    // organisationId du corps ignoré à la création
    const cree = await client
      .post('/api/clients')
      .loginAs(b)
      .withSession(sb)
      .json({ ...SAISIE, organisationId: orgA.id })
    cree.assertStatus(201)
    assert.equal((await Client.findOrFail(Number(cree.body().id))).organisationId, orgB.id)
  })
})
