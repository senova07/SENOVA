import { BaseSeeder } from '@adonisjs/lucid/seeders'
import env from '#start/env'
import Article from '#models/article'
import CategorieArticle from '#models/categorie_article'
import Organisation from '#models/organisation'
import Utilisateur from '#models/utilisateur'
import { inscrire } from '#services/organisations'
import type { TypeArticle } from '#shared/articles'

const CATEGORIES = [
  'Électricité',
  'Matériel',
  "Main-d'œuvre",
  'Frais',
  'Chauffage',
  'Climatisation',
  'Sécurité',
]

// référence, nom, type, catégorie, prix HT, TVA, unité, prix d'achat HT, favori, actif
const CATALOGUE: [
  string,
  string,
  TypeArticle,
  string,
  number,
  number,
  string,
  number | null,
  boolean,
  boolean,
][] = [
  [
    'ELEC-001',
    'Tableau électrique – remplacement',
    'produit',
    'Électricité',
    850,
    20,
    'u',
    null,
    true,
    true,
  ],
  [
    'ELEC-002',
    'Prise électrique double',
    'produit',
    'Électricité',
    12.5,
    20,
    'u',
    null,
    false,
    true,
  ],
  ['ELEC-003', 'Câble 3G2.5', 'produit', 'Matériel', 2.8, 20, 'm', null, false, true],
  [
    'MO-001',
    "Main-d'œuvre – installation",
    'main_oeuvre',
    "Main-d'œuvre",
    45,
    20,
    'h',
    null,
    true,
    true,
  ],
  ['PREST-001', 'Déplacement', 'deplacement', 'Frais', 60, 20, 'forfait', null, false, true],
  ['CHAUF-001', 'Thermostat connecté', 'produit', 'Chauffage', 120, 20, 'u', null, true, true],
  ['CHAUF-002', 'Radiateur 1000W', 'produit', 'Chauffage', 250, 20, 'u', null, false, true],
  ['CHAUF-003', 'Entretien chaudière', 'service', 'Chauffage', 90, 20, 'u', null, false, false],
  ['CLIM-001', 'Climatisation – pose', 'service', 'Climatisation', 450, 20, 'u', null, false, true],
  [
    'CLIM-002',
    'Forfait maintenance annuelle',
    'forfait',
    'Climatisation',
    290,
    20,
    'forfait',
    null,
    false,
    true,
  ],
  ['SEC-001', 'Détecteur de fumée', 'produit', 'Sécurité', 25, 20, 'u', null, false, true],
  ['SEC-002', 'Caméra de surveillance', 'produit', 'Sécurité', 180, 20, 'u', null, false, true],
  [
    'ELEC-004',
    'Rénovation – mise aux normes tableau',
    'service',
    'Électricité',
    600,
    10,
    'forfait',
    380,
    true,
    true,
  ],
  [
    'CHAUF-004',
    'Rénovation – pose radiateur électrique',
    'service',
    'Chauffage',
    320,
    10,
    'u',
    210,
    false,
    true,
  ],
]

/**
 * Données de démonstration — développement uniquement.
 *
 * Deux organisations avec chacune son propriétaire, pour éprouver l'isolation
 * entre organisations. Le mot de passe vient de `SEED_MOT_DE_PASSE` : aucun
 * mot de passe n'est écrit dans le code.
 */
export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const motDePasse = env.get('SEED_MOT_DE_PASSE')?.release()
    if (!motDePasse || motDePasse.length < 10) {
      throw new Error(
        'Renseignez SEED_MOT_DE_PASSE (10 caractères minimum) dans api/.env avant de lancer les seeders.'
      )
    }

    // Comptes créés une seule fois ; le catalogue de la démo est, lui, rechargé à chaque passage.
    if (!(await Utilisateur.query().first())) {
      await inscrire({
        nomComplet: 'Compte Démo',
        email: 'demo@senova.fr',
        motDePasse,
        nomOrganisation: 'Démo SENOVA',
      })
      await inscrire({
        nomComplet: 'Autre Propriétaire',
        email: 'autre@senova.fr',
        motDePasse,
        nomOrganisation: 'Autre Entreprise',
      })
    }

    const demo = await Organisation.findBy('nom', 'Démo SENOVA')
    if (!demo) return
    await Article.query().where('organisation_id', demo.id).delete()
    await CategorieArticle.query().where('organisation_id', demo.id).delete()

    const categories = new Map<string, number>()
    for (const nom of CATEGORIES) {
      const c = await CategorieArticle.create({ organisationId: demo.id, nom })
      categories.set(nom, c.id)
    }
    await Article.createMany(
      CATALOGUE.map(
        ([reference, nom, type, categorie, prix, tva, unite, achat, favori, actif], i) => ({
          organisationId: demo.id,
          reference,
          nom,
          type,
          categorieId: categories.get(categorie),
          prixUnitaireHt: prix,
          tauxTva: tva,
          unite,
          prixAchatHt: achat,
          favori,
          actif,
          ordre: i + 1,
        })
      )
    )
  }
}
