import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Article from '#models/article'
import CategorieArticle from '#models/categorie_article'
import Utilisateur from '#models/utilisateur'
import { ajouterMembre, creerCompte, session } from '#tests/aides'

const SAISIE = {
  nom: 'Pose carrelage',
  type: 'service',
  unite: 'm²',
  prixUnitaireHt: 45.5,
  tauxTva: 10,
  prixAchatHt: 30,
}

async function compte(nom = 'A') {
  const { utilisateur, organisation } = await creerCompte(nom)
  return { utilisateur, organisation, s: session(utilisateur, organisation) }
}

test.group('Articles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('CRUD : montants renvoyés en nombres, ordre auto', async ({ client, assert }) => {
    const { utilisateur, s } = await compte()
    const cree = await client.post('/api/articles').loginAs(utilisateur).withSession(s).json(SAISIE)
    cree.assertStatus(201)
    const a = cree.body()
    assert.strictEqual(a.prixUnitaireHt, 45.5)
    assert.strictEqual(a.tauxTva, 10)
    assert.strictEqual(a.prixAchatHt, 30)
    assert.equal(a.ordre, 1)
    assert.isTrue(a.actif)
    assert.isNull(a.reference)

    const b = (
      await client
        .post('/api/articles')
        .loginAs(utilisateur)
        .withSession(s)
        .json({ ...SAISIE, nom: 'Autre' })
    ).body()
    assert.equal(b.ordre, 2)

    const lu = await client.get(`/api/articles/${a.id}`).loginAs(utilisateur).withSession(s)
    lu.assertStatus(200)
    assert.equal(lu.body().nom, 'Pose carrelage')

    const maj = await client
      .put(`/api/articles/${a.id}`)
      .loginAs(utilisateur)
      .withSession(s)
      .json({ ...SAISIE, prixUnitaireHt: 50, prixAchatHt: null })
    maj.assertStatus(200)
    assert.strictEqual(maj.body().prixUnitaireHt, 50)
    assert.isNull(maj.body().prixAchatHt)

    const supp = await client.delete(`/api/articles/${a.id}`).loginAs(utilisateur).withSession(s)
    supp.assertStatus(204)
    ;(await client.get(`/api/articles/${a.id}`).loginAs(utilisateur).withSession(s)).assertStatus(
      404
    )
  })

  test('création d un article de type forfait', async ({ client, assert }) => {
    const { utilisateur, s } = await compte()
    const r = await client
      .post('/api/articles')
      .loginAs(utilisateur)
      .withSession(s)
      .json({ ...SAISIE, nom: 'Forfait maintenance', type: 'forfait', unite: 'forfait' })
    r.assertStatus(201)
    assert.equal(r.body().type, 'forfait')
  })

  test('validation : type inconnu, prix négatif, référence en double', async ({ client }) => {
    const { utilisateur, s } = await compte()
    const poster = (corps: object) =>
      client.post('/api/articles').loginAs(utilisateur).withSession(s).json(corps)
    ;(await poster({ ...SAISIE, type: 'zzz' })).assertStatus(422)
    ;(await poster({ ...SAISIE, prixUnitaireHt: -1 })).assertStatus(422)
    ;(await poster({ ...SAISIE, reference: 'REF' })).assertStatus(201)
    ;(await poster({ ...SAISIE, reference: 'REF' })).assertStatus(422)
    ;(await poster({ ...SAISIE, reference: null })).assertStatus(201)
    ;(await poster({ ...SAISIE, reference: null })).assertStatus(201)
  })

  test('recherche et filtres, favoris d abord, inactifs masqués', async ({ client, assert }) => {
    const { utilisateur, s } = await compte()
    const poster = async (corps: object) =>
      (await client.post('/api/articles').loginAs(utilisateur).withSession(s).json(corps)).body()
    const cat = (
      await client
        .post('/api/categories-articles')
        .loginAs(utilisateur)
        .withSession(s)
        .json({ nom: 'Sols' })
    ).body()
    const a = await poster({ ...SAISIE, nom: 'Carrelage', reference: 'CAR-1', categorieId: cat.id })
    await poster({ ...SAISIE, nom: 'Peinture', type: 'produit', description: 'blanc mat' })
    const c = await poster({ ...SAISIE, nom: 'Zéro', actif: false })
    const lister = async (qs: string) =>
      (await client.get(`/api/articles${qs}`).loginAs(utilisateur).withSession(s)).body()

    assert.lengthOf(await lister(''), 2)
    assert.lengthOf(await lister('?inactifs=1'), 3)
    assert.deepEqual(
      (await lister('?recherche=car-1')).map((x: any) => x.nom),
      ['Carrelage']
    )
    assert.deepEqual(
      (await lister('?recherche=BLANC')).map((x: any) => x.nom),
      ['Peinture']
    )
    assert.deepEqual(
      (await lister('?type=produit')).map((x: any) => x.nom),
      ['Peinture']
    )
    assert.deepEqual(
      (await lister(`?categorie=${cat.id}`)).map((x: any) => x.id),
      [a.id]
    )
    assert.lengthOf(await lister('?recherche=%25'), 0)

    const fav = await client
      .post(`/api/articles/${c.id}/favori`)
      .loginAs(utilisateur)
      .withSession(s)
      .json({ favori: true })
    fav.assertStatus(200)
    assert.isTrue(fav.body().favori)
    const tous = await lister('?inactifs=1')
    assert.equal(tous[0].id, c.id)
    assert.deepEqual(
      (await lister('?favoris=1&inactifs=1')).map((x: any) => x.id),
      [c.id]
    )
  })

  test('ordre : les ids cités passent devant, les autres suivent', async ({ client, assert }) => {
    const { utilisateur, s } = await compte()
    const ids: string[] = []
    for (const nom of ['a', 'b', 'c']) {
      ids.push(
        (
          await client
            .post('/api/articles')
            .loginAs(utilisateur)
            .withSession(s)
            .json({ ...SAISIE, nom })
        ).body().id
      )
    }
    const rep = await client
      .put('/api/articles/ordre')
      .loginAs(utilisateur)
      .withSession(s)
      .json({ ids: [ids[2], ids[0]].map(Number) })
    rep.assertStatus(204)
    const liste = await client.get('/api/articles').loginAs(utilisateur).withSession(s)
    assert.deepEqual(
      liste.body().map((x: any) => x.nom),
      ['c', 'a', 'b']
    )
  })

  test('taux de TVA hors liste : 422', async ({ client }) => {
    const { utilisateur, s } = await compte()
    const rep = await client
      .post('/api/articles')
      .loginAs(utilisateur)
      .withSession(s)
      .json({ ...SAISIE, tauxTva: 12 })
    rep.assertStatus(422)
  })

  test('dupliquer : copie sans référence ni favori', async ({ client, assert }) => {
    const { utilisateur, s } = await compte()
    const a = (
      await client
        .post('/api/articles')
        .loginAs(utilisateur)
        .withSession(s)
        .json({ ...SAISIE, reference: 'X1', favori: true })
    ).body()
    const copie = await client
      .post(`/api/articles/${a.id}/dupliquer`)
      .loginAs(utilisateur)
      .withSession(s)
    copie.assertStatus(201)
    assert.equal(copie.body().nom, 'Pose carrelage (copie)')
    assert.isNull(copie.body().reference)
    assert.isFalse(copie.body().favori)
    assert.notEqual(copie.body().id, a.id)
  })

  test('unités : défauts + celles de l organisation', async ({ client, assert }) => {
    const { utilisateur, s } = await compte()
    await client
      .post('/api/articles')
      .loginAs(utilisateur)
      .withSession(s)
      .json({ ...SAISIE, unite: 'palette' })
    const rep = await client.get('/api/articles/unites').loginAs(utilisateur).withSession(s)
    rep.assertStatus(200)
    assert.include(rep.body(), 'forfait')
    assert.include(rep.body(), 'palette')
  })
})

test.group('Catégories d articles', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('unicité insensible à la casse, renommage, suppression → null', async ({
    client,
    assert,
  }) => {
    const { utilisateur, s } = await compte()
    const creer = (nom: string) =>
      client.post('/api/categories-articles').loginAs(utilisateur).withSession(s).json({ nom })
    const sols = await creer('Sols')
    sols.assertStatus(201)
    ;(await creer('sols')).assertStatus(422)
    ;(await creer('SOLS')).assertStatus(422)
    const murs = (await creer('Murs')).body()

    ;(
      await client
        .put(`/api/categories-articles/${murs.id}`)
        .loginAs(utilisateur)
        .withSession(s)
        .json({ nom: 'sols' })
    ).assertStatus(422)
    const renomme = await client
      .put(`/api/categories-articles/${murs.id}`)
      .loginAs(utilisateur)
      .withSession(s)
      .json({ nom: 'Murs et plafonds' })
    renomme.assertStatus(200)

    const article = (
      await client
        .post('/api/articles')
        .loginAs(utilisateur)
        .withSession(s)
        .json({ ...SAISIE, categorieId: Number(murs.id) })
    ).body()
    assert.equal(article.categorieId, murs.id)

    ;(
      await client.delete(`/api/categories-articles/${murs.id}`).loginAs(utilisateur).withSession(s)
    ).assertStatus(204)
    const apres = await client
      .get(`/api/articles/${article.id}`)
      .loginAs(utilisateur)
      .withSession(s)
    assert.isNull(apres.body().categorieId)

    const liste = await client.get('/api/categories-articles').loginAs(utilisateur).withSession(s)
    assert.deepEqual(
      liste.body().map((c: any) => c.nom),
      ['Sols']
    )
  })
})

test.group('Articles : permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Comptable lit mais ne gère pas ; sans session 401', async ({ client }) => {
    const { organisation } = await creerCompte('A')
    const { utilisateur: autre } = await creerCompte('Z')
    const u = await Utilisateur.findOrFail(autre.id)
    await ajouterMembre(u, organisation, 'Comptable')
    const s = session(u, organisation)

    ;(await client.get('/api/articles').loginAs(u).withSession(s)).assertStatus(200)
    ;(await client.get('/api/categories-articles').loginAs(u).withSession(s)).assertStatus(200)
    ;(await client.post('/api/articles').loginAs(u).withSession(s).json(SAISIE)).assertStatus(403)
    ;(
      await client
        .put('/api/articles/ordre')
        .loginAs(u)
        .withSession(s)
        .json({ ids: [1] })
    ).assertStatus(403)
    ;(
      await client.post('/api/categories-articles').loginAs(u).withSession(s).json({ nom: 'x' })
    ).assertStatus(403)
    ;(await client.delete('/api/articles/1').loginAs(u).withSession(s)).assertStatus(403)
    ;(await client.get('/api/articles')).assertStatus(401)
  })
})

test.group('Articles : isolation entre organisations', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('B ne lit, modifie, supprime, réordonne ni ne liste les articles de A', async ({
    client,
    assert,
  }) => {
    const a = await compte('A')
    const b = await compte('B')
    const art = (
      await client
        .post('/api/articles')
        .loginAs(a.utilisateur)
        .withSession(a.s)
        .json({ ...SAISIE, reference: 'SECRET' })
    ).body()
    const cat = (
      await client
        .post('/api/categories-articles')
        .loginAs(a.utilisateur)
        .withSession(a.s)
        .json({ nom: 'Privée' })
    ).body()
    const enB = (req: any) => req.loginAs(b.utilisateur).withSession(b.s)

    assert.lengthOf((await enB(client.get('/api/articles'))).body(), 0)
    assert.lengthOf((await enB(client.get('/api/categories-articles'))).body(), 0)
    ;(await enB(client.get(`/api/articles/${art.id}`))).assertStatus(404)
    ;(await enB(client.put(`/api/articles/${art.id}`).json(SAISIE))).assertStatus(404)
    ;(await enB(client.delete(`/api/articles/${art.id}`))).assertStatus(404)
    ;(await enB(client.post(`/api/articles/${art.id}/favori`).json({ favori: true }))).assertStatus(
      404
    )
    ;(await enB(client.post(`/api/articles/${art.id}/dupliquer`))).assertStatus(404)
    ;(await enB(client.put('/api/articles/ordre').json({ ids: [Number(art.id)] }))).assertStatus(
      422
    )
    ;(
      await enB(client.put(`/api/categories-articles/${cat.id}`).json({ nom: 'Pirate' }))
    ).assertStatus(404)
    ;(await enB(client.delete(`/api/categories-articles/${cat.id}`))).assertStatus(404)

    // Une catégorie de A ne se rattache pas à un article de B.
    ;(
      await enB(client.post('/api/articles').json({ ...SAISIE, categorieId: Number(cat.id) }))
    ).assertStatus(422)
    // Même référence dans deux organisations : autorisé.
    ;(
      await enB(client.post('/api/articles').json({ ...SAISIE, reference: 'SECRET' }))
    ).assertStatus(201)

    const intact = await Article.findOrFail(Number(art.id))
    assert.equal(intact.nom, 'Pose carrelage')
    assert.isNotNull(await CategorieArticle.find(Number(cat.id)))
  })
})
