// Captures d'écran de l'application avec une API simulée (l'API réelle n'est pas nécessaire).
// Usage : outil Playwright MCP `browser_run_code_unsafe` avec filename=scripts/captures/captures.js,
// Vite lancé avec `npx vite --port 5174` (5173 sert souvent à Relook).
// Dossier de sortie : variable DOSSIER ci-dessous (avant / apres).
async (page) => {
  const DOSSIER = 'docs/captures/apres'
  const BASE = 'http://localhost:5174'

  const organisation = {
    id: '1', nom: 'Atelier Martin', formeJuridique: 'EI', siren: null, siret: null, tvaIntracom: null,
    adresse: '12 rue des Artisans', codePostal: '69003', ville: 'Lyon', pays: 'FR',
    email: 'contact@atelier-martin.fr', telephone: '04 78 12 34 56',
  }
  const session = {
    utilisateur: { id: '1', email: 'lucas@atelier-martin.fr', nomComplet: 'Lucas Martin' },
    organisation,
    organisations: [{ id: '1', nom: 'Atelier Martin' }],
    permissions: ['clients.voir', 'clients.gerer', 'articles.voir', 'articles.gerer', 'devis.voir',
      'devis.gerer', 'factures.voir', 'factures.gerer', 'paiements.voir', 'paiements.gerer',
      'equipe.gerer', 'organisation.gerer'],
  }
  const article = (id, nom, type, unite, prix, tva, favori, reference, description) => ({
    id, reference, nom, description, type, unite, prixUnitaireHt: prix, tauxTva: tva,
    prixAchatHt: null, categorieId: null, favori, actif: true, ordre: Number(id),
  })
  const articles = [
    article('1', 'Heure de plomberie', 'main_oeuvre', 'h', 65, 20, true, 'MO-001', 'Intervention sur site'),
    article('2', 'Mitigeur thermostatique', 'produit', 'u', 129, 20, false, 'PR-024', 'Grohe – Modèle professionnel'),
    article('3', 'Forfait déplacement', 'deplacement', 'forfait', 35, 20, true, 'DEP-01', 'Déplacement sur chantier'),
    article('4', 'Entretien chaudière annuel', 'service', 'forfait', 180, 10, false, 'SERV-12', 'Contrôle et nettoyage complet'),
    article('5', 'Pose lavabo', 'service', 'forfait', 240, 20, false, 'SERV-16', 'Installation complète'),
    article('6', 'Contrat entretien', 'abonnement', 'mois', 15, 20, false, 'ABO-01', 'Visite annuelle incluse'),
  ]
  const client = (id, nature, nom, prenom, email, telephone) => ({
    id, nature, nom, prenom, email, telephone, siren: null, siret: null, tvaIntracom: null,
    tags: [], archiveLe: null, createdAt: '2026-10-01T09:00:00.000Z',
  })
  const clients = [
    client('1', 'particulier', 'Durand', 'Sophie', 'sophie.durand@email.fr', '06 12 34 56 78'),
    client('2', 'entreprise', 'Boulangerie Petit', null, 'contact@boulangerie-petit.fr', '04 78 00 11 22'),
    client('3', 'particulier', 'Bernard', 'Paul', 'paul.bernard@email.fr', '06 98 76 54 32'),
  ]
  const fiche = { ...clients[0], notes: null, archiveMotif: null,
    adresses: [{ id: '1', libelle: 'Domicile', ligne1: '8 rue Paul Bert', ligne2: null, codePostal: '69003',
      ville: 'Lyon', pays: 'FR', parDefaut: true }],
    contacts: [] }

  const reponses = [
    [/\/api\/auth\/session$/, session],
    [/\/api\/organisation$/, organisation],
    [/\/api\/articles\/unites$/, ['u', 'h', 'forfait', 'mois']],
    [/\/api\/articles(\?.*)?$/, articles],
    [/\/api\/categories-articles$/, []],
    [/\/api\/clients\/\d+$/, fiche],
    [/\/api\/clients(\?.*)?$/, { donnees: clients, total: clients.length, page: 1, parPage: 25 }],
  ]
  await page.route(/\/api\/(?!shared\/)/, (route) => {
    const url = route.request().url()
    const trouve = reponses.find(([motif]) => motif.test(url))
    return route.fulfill(trouve ? { json: trouve[1] } : { status: 404, json: { message: 'Simulé : introuvable' } })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  const ecrans = [
    ['aujourdhui', '/'], ['articles', '/articles'], ['clients', '/clients'], ['fiche-client', '/clients/1'],
    ['devis', '/devis'], ['devis-nouveau', '/devis?nouveau=1'], ['articles-import', '/articles/import'],
    ['documents-apparence', '/documents/apparence'],
  ]
  const faits = []
  for (const [nom, chemin] of ecrans) {
    await page.goto(BASE + chemin)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${DOSSIER}/${nom}.png` })
    faits.push(nom)
  }
  return faits
}
