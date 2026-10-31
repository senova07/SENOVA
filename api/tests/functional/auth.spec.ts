import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Membre from '#models/membre'
import Role from '#models/role'
import Utilisateur from '#models/utilisateur'
import { PERMISSIONS } from '#shared/permissions'
import { MOT_DE_PASSE, ajouterMembre, creerCompte, session } from '#tests/aides'

const INSCRIPTION = {
  nomComplet: 'Claire Martin',
  email: 'claire@exemple.fr',
  motDePasse: MOT_DE_PASSE,
  nomOrganisation: 'Martin Plomberie',
}

test.group('Inscription', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée utilisateur, organisation, 4 rôles et membre propriétaire, et connecte', async ({
    client,
    assert,
  }) => {
    const reponse = await client.post('/api/auth/inscription').json(INSCRIPTION)
    reponse.assertStatus(201)
    const corps = reponse.body()
    assert.equal(corps.utilisateur.email, 'claire@exemple.fr')
    assert.equal(corps.organisation.nom, 'Martin Plomberie')
    assert.isString(corps.organisation.id)
    assert.deepEqual(corps.organisations, [{ id: corps.organisation.id, nom: 'Martin Plomberie' }])
    assert.sameMembers(corps.permissions, [...PERMISSIONS])

    const roles = await Role.query().where('organisation_id', corps.organisation.id)
    assert.sameMembers(
      roles.map((r) => r.nom),
      ['Propriétaire', 'Admin', 'Employé', 'Comptable']
    )
    const utilisateur = await Utilisateur.findByOrFail('email', 'claire@exemple.fr')
    assert.notEqual(utilisateur.motDePasse, MOT_DE_PASSE)
    assert.lengthOf(await Membre.query().where('utilisateur_id', utilisateur.id), 1)
  })

  test('refuse un mot de passe trop court et un e-mail déjà pris', async ({ client }) => {
    const court = await client
      .post('/api/auth/inscription')
      .json({ ...INSCRIPTION, motDePasse: 'court' })
    court.assertStatus(422)

    const premiere = await client.post('/api/auth/inscription').json(INSCRIPTION)
    premiere.assertStatus(201)

    const doublon = await client.post('/api/auth/inscription').json(INSCRIPTION)
    doublon.assertStatus(422)
    doublon.assertBodyContains({ code: 'E_REGLE_METIER' })
  })
})

test.group('Connexion', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('connexion correcte', async ({ client, assert }) => {
    const { utilisateur, organisation } = await creerCompte('Dupont SARL')
    const reponse = await client
      .post('/api/auth/connexion')
      .json({ email: utilisateur.email.toUpperCase(), motDePasse: MOT_DE_PASSE })
    reponse.assertStatus(200)
    assert.equal(reponse.body().organisation.id, String(organisation.id))
    assert.equal(reponse.body().utilisateur.id, String(utilisateur.id))
  })

  test('même réponse générique : mauvais mot de passe, compte inconnu, compte désactivé', async ({
    client,
    assert,
  }) => {
    const { utilisateur } = await creerCompte()
    const mauvais = await client
      .post('/api/auth/connexion')
      .json({ email: utilisateur.email, motDePasse: 'mauvais-mot-de-passe' })
    const inconnu = await client
      .post('/api/auth/connexion')
      .json({ email: 'personne@exemple.fr', motDePasse: MOT_DE_PASSE })
    utilisateur.actif = false
    await utilisateur.save()
    const desactive = await client
      .post('/api/auth/connexion')
      .json({ email: utilisateur.email, motDePasse: MOT_DE_PASSE })

    for (const reponse of [mauvais, inconnu, desactive]) {
      reponse.assertStatus(400)
      assert.deepEqual(reponse.body(), mauvais.body())
    }
    assert.equal(mauvais.body().code, 'E_IDENTIFIANTS_INVALIDES')
  })

  test('429 après 5 tentatives de connexion, compteur remis à zéro après un succès', async ({
    client,
    assert,
  }) => {
    const { utilisateur } = await creerCompte()
    const mauvais = { email: utilisateur.email, motDePasse: 'mauvais-mot-de-passe' }
    for (let i = 0; i < 4; i++) {
      ;(await client.post('/api/auth/connexion').json(mauvais)).assertStatus(400)
    }
    // Un succès réinitialise : de nouveaux échecs repartent de zéro.
    ;(
      await client
        .post('/api/auth/connexion')
        .json({ email: utilisateur.email, motDePasse: MOT_DE_PASSE })
    ).assertStatus(200)

    for (let i = 0; i < 5; i++) {
      ;(await client.post('/api/auth/connexion').json(mauvais)).assertStatus(400)
    }
    const bloque = await client.post('/api/auth/connexion').json(mauvais)
    bloque.assertStatus(429)
    assert.equal(bloque.body().code, 'E_TROP_DE_REQUETES')
    assert.match(bloque.body().message, /Trop de tentatives/)
  })

  test('compte sans adhésion active : erreur explicite, pas de session', async ({ client }) => {
    const { utilisateur } = await creerCompte()
    await Membre.query().where('utilisateur_id', utilisateur.id).update({ actif: false })
    const reponse = await client
      .post('/api/auth/connexion')
      .json({ email: utilisateur.email, motDePasse: MOT_DE_PASSE })
    reponse.assertStatus(422)
    reponse.assertBodyContains({ code: 'E_REGLE_METIER' })
  })

  test('429 par IP seule après 50 tentatives, même avec des e-mails différents', async ({
    client,
  }) => {
    for (let i = 0; i < 50; i++) {
      ;(
        await client
          .post('/api/auth/connexion')
          .json({ email: `inconnu${i}@exemple.fr`, motDePasse: 'mauvais-mot-de-passe' })
      ).assertStatus(400)
    }
    const bloque = await client
      .post('/api/auth/connexion')
      .json({ email: 'autre@exemple.fr', motDePasse: 'mauvais-mot-de-passe' })
    bloque.assertStatus(429)
  })

  test('déconnexion', async ({ client }) => {
    const { utilisateur, organisation } = await creerCompte()
    const reponse = await client
      .post('/api/auth/deconnexion')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
    reponse.assertStatus(200)
  })
})

test.group('Session et organisation courante', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /api/auth/session renvoie utilisateur, organisation, organisations, permissions', async ({
    client,
    assert,
  }) => {
    const { utilisateur, organisation } = await creerCompte('Alpha')
    const reponse = await client
      .get('/api/auth/session')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
    reponse.assertStatus(200)
    assert.equal(reponse.body().organisation.nom, 'Alpha')
    assert.deepEqual(reponse.body().organisations, [{ id: String(organisation.id), nom: 'Alpha' }])
    assert.notProperty(reponse.body().utilisateur, 'motDePasse')
    assert.include(reponse.body().permissions, 'organisation.gerer')
  })

  test('sans connexion : 401', async ({ client }) => {
    const reponse = await client.get('/api/auth/session')
    reponse.assertStatus(401)
  })

  test('changement d organisation accepté pour un membre, refusé sinon', async ({
    client,
    assert,
  }) => {
    const { utilisateur, organisation } = await creerCompte('Alpha')
    const { organisation: autre } = await creerCompte('Beta')
    const { organisation: etrangere } = await creerCompte('Gamma')
    await ajouterMembre(utilisateur, autre, 'Comptable')

    const accepte = await client
      .post('/api/auth/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
      .json({ organisationId: String(autre.id) })
    accepte.assertStatus(200)
    assert.equal(accepte.body().organisation.nom, 'Beta')
    assert.lengthOf(accepte.body().organisations, 2)
    assert.notInclude(accepte.body().permissions, 'organisation.gerer')

    const refuse = await client
      .post('/api/auth/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
      .json({ organisationId: String(etrangere.id) })
    refuse.assertStatus(403)
  })

  test('un membre désactivé ne peut pas rejoindre l organisation', async ({ client }) => {
    const { utilisateur, organisation } = await creerCompte('Alpha')
    const { organisation: autre } = await creerCompte('Beta')
    await ajouterMembre(utilisateur, autre, 'Employé', false)
    const reponse = await client
      .post('/api/auth/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
      .json({ organisationId: String(autre.id) })
    reponse.assertStatus(403)
  })
})

test.group('Middleware organisation et permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('403 sans organisation courante ou si non membre de celle de la session', async ({
    client,
  }) => {
    const { utilisateur } = await creerCompte('Alpha')
    const { organisation: etrangere } = await creerCompte('Beta')

    const sansOrganisation = await client
      .get('/api/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur))
    sansOrganisation.assertStatus(403)

    const nonMembre = await client
      .get('/api/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, etrangere))
    nonMembre.assertStatus(403)
  })

  test('GET/PUT /api/organisation : le propriétaire modifie, le comptable lit seulement', async ({
    client,
    assert,
  }) => {
    const { utilisateur, organisation } = await creerCompte('Alpha')
    const { utilisateur: comptable } = await creerCompte('Autre')
    await ajouterMembre(comptable, organisation, 'Comptable')

    const maj = await client
      .put('/api/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
      .json({ nom: 'Alpha SAS', siret: '12345678901234', ville: 'Lyon' })
    maj.assertStatus(200)
    assert.equal(maj.body().nom, 'Alpha SAS')
    assert.equal(maj.body().ville, 'Lyon')
    assert.equal(maj.body().pays, 'FR')

    const lecture = await client
      .get('/api/organisation')
      .loginAs(comptable)
      .withSession(session(comptable, organisation))
    lecture.assertStatus(200)
    assert.equal(lecture.body().siret, '12345678901234')

    const interdit = await client
      .put('/api/organisation')
      .loginAs(comptable)
      .withSession(session(comptable, organisation))
      .json({ nom: 'Piraté' })
    interdit.assertStatus(403)
  })

  test('validation du profil : SIRET invalide refusé', async ({ client }) => {
    const { utilisateur, organisation } = await creerCompte('Alpha')
    const reponse = await client
      .put('/api/organisation')
      .loginAs(utilisateur)
      .withSession(session(utilisateur, organisation))
      .json({ nom: 'Alpha', siret: 'abc' })
    reponse.assertStatus(422)
  })
})
