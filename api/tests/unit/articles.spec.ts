import { test } from '@japa/runner'
import { ligneDepuisArticle, margeArticle, type Article } from '#shared/articles'

const article: Article = {
  id: '7',
  reference: 'R1',
  nom: 'Pose',
  description: 'Pose complète',
  type: 'service',
  unite: 'h',
  prixUnitaireHt: 60,
  tauxTva: 20,
  prixAchatHt: 40,
  categorieId: null,
  favori: false,
  actif: true,
  ordre: 1,
}

test.group('margeArticle', () => {
  test('montant et taux de marge sur le coût', ({ assert }) => {
    assert.deepEqual(margeArticle(article), { montant: 20, taux: 50 })
    assert.deepEqual(margeArticle({ prixUnitaireHt: 10, prixAchatHt: 3 }), {
      montant: 7,
      taux: 233.33,
    })
  })

  test('null sans prix d achat, taux 0 si achat à 0, marge négative possible', ({ assert }) => {
    assert.isNull(margeArticle({ prixUnitaireHt: 10, prixAchatHt: null }))
    assert.deepEqual(margeArticle({ prixUnitaireHt: 10, prixAchatHt: 0 }), { montant: 10, taux: 0 })
    assert.deepEqual(margeArticle({ prixUnitaireHt: 8, prixAchatHt: 10 }), {
      montant: -2,
      taux: -20,
    })
  })
})

test.group('ligneDepuisArticle', () => {
  test('copie figée : snapshot indépendant de l article', ({ assert }) => {
    const ligne = ligneDepuisArticle(article)
    assert.deepEqual(ligne, {
      articleId: '7',
      nom: 'Pose',
      description: 'Pose complète',
      unite: 'h',
      prixUnitaireHt: 60,
      tauxTva: 20,
      type: 'service',
      quantite: 1,
    })
    article.nom = 'Modifié'
    article.prixUnitaireHt = 99
    assert.equal(ligne.nom, 'Pose')
    assert.equal(ligne.prixUnitaireHt, 60)
    ligne.quantite = 5
    assert.equal(ligneDepuisArticle(article).quantite, 1)
  })
})
