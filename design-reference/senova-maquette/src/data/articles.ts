export type ArticleType = 'service' | 'produit' | 'main-oeuvre' | 'deplacement' | 'abonnement' | 'autre'

export interface Article {
  id: string
  name: string
  description?: string
  type: ArticleType
  reference: string
  unit: string
  priceHT: number
  vatRate: number
  purchasePrice?: number
  category?: string
  favorite: boolean
  /** ISO date de la dernière utilisation dans un devis ou une facture, null si jamais utilisé */
  lastUsedAt: string | null
}

export const ARTICLE_TYPES: { id: ArticleType; label: string; plural: string; refPrefix: string; defaultUnit: string }[] = [
  { id: 'service', label: 'Service', plural: 'Services', refPrefix: 'SERV', defaultUnit: 'forfait' },
  { id: 'produit', label: 'Produit', plural: 'Produits', refPrefix: 'PR', defaultUnit: 'unité' },
  { id: 'main-oeuvre', label: 'Main-d’œuvre', plural: 'Main-d’œuvre', refPrefix: 'MO', defaultUnit: 'heure' },
  { id: 'deplacement', label: 'Déplacement', plural: 'Déplacements', refPrefix: 'DEP', defaultUnit: 'forfait' },
  { id: 'abonnement', label: 'Abonnement', plural: 'Abonnements', refPrefix: 'ABO', defaultUnit: 'mois' },
  { id: 'autre', label: 'Autre', plural: 'Autres', refPrefix: 'DIV', defaultUnit: 'unité' },
]

export const typeLabel = (t: ArticleType) => ARTICLE_TYPES.find((x) => x.id === t)!.label

export const UNITS = ['heure', 'unité', 'forfait', 'jour', 'mois', 'km', 'm²', 'ml', 'lot']
export const VAT_RATES = [20, 10, 5.5, 2.1, 0]
export const CATEGORIES = ['Plomberie', 'Chauffage', 'Sanitaire', 'Interventions', 'Divers']

/** Dates relatives à aujourd'hui pour que la maquette reste crédible quel que soit le jour d'ouverture. */
const daysAgo = (n: number) => {
  const d = new Date()
  d.setHours(10, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const INITIAL_ARTICLES: Article[] = [
  { id: 'a1', name: 'Heure de plomberie', description: 'Intervention sur site', type: 'main-oeuvre', reference: 'MO-001', unit: 'heure', priceHT: 65, vatRate: 20, category: 'Plomberie', favorite: true, lastUsedAt: daysAgo(0) },
  { id: 'a2', name: 'Mitigeur thermostatique', description: 'Grohe – Modèle professionnel', type: 'produit', reference: 'PR-024', unit: 'unité', priceHT: 129, vatRate: 20, purchasePrice: 78.4, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(1) },
  { id: 'a3', name: 'Forfait déplacement', description: 'Déplacement sur chantier', type: 'deplacement', reference: 'DEP-01', unit: 'forfait', priceHT: 35, vatRate: 20, category: 'Interventions', favorite: true, lastUsedAt: daysAgo(15) },
  { id: 'a4', name: 'Entretien chaudière annuel', description: 'Contrôle et nettoyage complet', type: 'service', reference: 'SERV-12', unit: 'forfait', priceHT: 180, vatRate: 10, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(19) },
  { id: 'a5', name: 'Pose lavabo', description: 'Installation complète', type: 'service', reference: 'SERV-16', unit: 'forfait', priceHT: 240, vatRate: 20, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(25) },
  { id: 'a6', name: 'Main-d’œuvre dépannage urgent', description: 'Intervention en urgence', type: 'main-oeuvre', reference: 'MO-007', unit: 'heure', priceHT: 85, vatRate: 20, category: 'Interventions', favorite: true, lastUsedAt: daysAgo(29) },
  { id: 'a7', name: 'Vanne d’arrêt', description: 'Laiton – 15/21', type: 'produit', reference: 'PR-028', unit: 'unité', priceHT: 24.5, vatRate: 20, purchasePrice: 11.8, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(32) },
  { id: 'a8', name: 'Forfait mise en service', description: 'Mise en service et réglages', type: 'service', reference: 'SERV-20', unit: 'forfait', priceHT: 120, vatRate: 20, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(37) },
  { id: 'a9', name: 'Cartouche mitigeur', description: 'Pièce de rechange', type: 'produit', reference: 'PR-031', unit: 'unité', priceHT: 42, vatRate: 20, purchasePrice: 21, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(39) },
  { id: 'a10', name: 'Diagnostic panne', description: 'Analyse et rapport', type: 'service', reference: 'SERV-21', unit: 'forfait', priceHT: 90, vatRate: 20, category: 'Interventions', favorite: false, lastUsedAt: daysAgo(42) },
  { id: 'a11', name: 'Heure de chauffagiste', description: 'Dépannage et réglage chauffage', type: 'main-oeuvre', reference: 'MO-002', unit: 'heure', priceHT: 70, vatRate: 20, category: 'Chauffage', favorite: true, lastUsedAt: daysAgo(44) },
  { id: 'a12', name: 'Raccords cuivre 16 mm', description: 'Lot de 10, à souder', type: 'produit', reference: 'PR-108', unit: 'lot', priceHT: 18.5, vatRate: 20, purchasePrice: 9.2, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(45) },
  { id: 'a13', name: 'Débouchage canalisation', description: 'Furet mécanique, jusqu’à 20 m', type: 'service', reference: 'SERV-09', unit: 'forfait', priceHT: 95, vatRate: 10, category: 'Plomberie', favorite: true, lastUsedAt: daysAgo(46) },
  { id: 'a14', name: 'Recherche de fuite', description: 'Caméra thermique et gaz traceur', type: 'service', reference: 'SERV-07', unit: 'forfait', priceHT: 150, vatRate: 20, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(48) },
  { id: 'a15', name: 'Siphon de lavabo', description: 'PVC, sortie horizontale', type: 'produit', reference: 'PR-112', unit: 'unité', priceHT: 12.9, vatRate: 20, purchasePrice: 5.4, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(49) },
  { id: 'a16', name: 'Ballon d’eau chaude 200 L', description: 'Chauffe-eau électrique vertical', type: 'produit', reference: 'PR-035', unit: 'unité', priceHT: 489, vatRate: 20, purchasePrice: 312, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(51) },
  { id: 'a17', name: 'Contrat d’entretien chaudière', description: 'Visite annuelle et dépannage prioritaire', type: 'abonnement', reference: 'ABO-01', unit: 'mois', priceHT: 14.9, vatRate: 20, category: 'Chauffage', favorite: true, lastUsedAt: daysAgo(52) },
  { id: 'a18', name: 'Indemnité kilométrique hors zone', description: 'Au-delà de 15 km du dépôt', type: 'deplacement', reference: 'DEP-02', unit: 'km', priceHT: 0.65, vatRate: 20, category: 'Interventions', favorite: false, lastUsedAt: daysAgo(53) },
  { id: 'a19', name: 'Heure d’apprenti', description: 'Accompagnement sur chantier', type: 'main-oeuvre', reference: 'MO-003', unit: 'heure', priceHT: 38, vatRate: 20, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(55) },
  { id: 'a20', name: 'Remplacement WC suspendu', description: 'Bâti-support, cuvette et plaque', type: 'service', reference: 'SERV-15', unit: 'forfait', priceHT: 640, vatRate: 10, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(56) },
  { id: 'a21', name: 'Télésurveillance chaudière', description: 'Alerte panne et suivi', type: 'abonnement', reference: 'ABO-02', unit: 'mois', priceHT: 9.9, vatRate: 20, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(58) },
  { id: 'a22', name: 'Évacuation des déchets', description: 'Tri et dépôt en déchetterie', type: 'autre', reference: 'DIV-01', unit: 'forfait', priceHT: 25, vatRate: 20, category: 'Divers', favorite: false, lastUsedAt: daysAgo(60) },
  { id: 'a23', name: 'Purge et désembouage radiateurs', description: 'Jusqu’à 8 radiateurs', type: 'service', reference: 'SERV-23', unit: 'forfait', priceHT: 340, vatRate: 10, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(61) },
  { id: 'a24', name: 'Journée de chantier', description: 'Équipe de deux, 8 h sur site', type: 'main-oeuvre', reference: 'MO-010', unit: 'jour', priceHT: 760, vatRate: 20, category: 'Plomberie', favorite: true, lastUsedAt: daysAgo(63) },
  { id: 'a25', name: 'Robinet thermostatique', description: 'Tête et corps, finition blanche', type: 'produit', reference: 'PR-041', unit: 'unité', priceHT: 38, vatRate: 20, purchasePrice: 19.5, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(64) },
  { id: 'a26', name: 'Groupe de sécurité', description: 'Pour chauffe-eau, 3/4 pouce', type: 'produit', reference: 'PR-044', unit: 'unité', priceHT: 29.9, vatRate: 20, purchasePrice: 13.1, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(66) },
  { id: 'a27', name: 'Flexible inox 50 cm', description: 'Raccordement sanitaire', type: 'produit', reference: 'PR-047', unit: 'unité', priceHT: 8.9, vatRate: 20, purchasePrice: 3.6, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(67) },
  { id: 'a28', name: 'Pose évier cuisine', description: 'Raccordement et étanchéité', type: 'service', reference: 'SERV-25', unit: 'forfait', priceHT: 180, vatRate: 10, category: 'Sanitaire', favorite: true, lastUsedAt: daysAgo(69) },
  { id: 'a29', name: 'Remplacement chasse d’eau', description: 'Mécanisme complet', type: 'service', reference: 'SERV-26', unit: 'forfait', priceHT: 110, vatRate: 10, category: 'Sanitaire', favorite: true, lastUsedAt: daysAgo(70) },
  { id: 'a30', name: 'Détartrage chauffe-eau', description: 'Vidange et nettoyage', type: 'service', reference: 'SERV-27', unit: 'forfait', priceHT: 160, vatRate: 10, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(72) },
  { id: 'a31', name: 'Tube PER 16 mm', description: 'Couronne de 50 m', type: 'produit', reference: 'PR-052', unit: 'lot', priceHT: 54, vatRate: 20, purchasePrice: 31, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(73) },
  { id: 'a32', name: 'Collier de fixation', description: 'Lot de 20', type: 'produit', reference: 'PR-055', unit: 'lot', priceHT: 9.5, vatRate: 20, purchasePrice: 3.9, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(75) },
  { id: 'a33', name: 'Forfait urgence week-end', description: 'Majoration samedi et dimanche', type: 'deplacement', reference: 'DEP-03', unit: 'forfait', priceHT: 60, vatRate: 20, category: 'Interventions', favorite: true, lastUsedAt: daysAgo(76) },
  { id: 'a34', name: 'Ramonage conduit', description: 'Certificat de ramonage inclus', type: 'service', reference: 'SERV-29', unit: 'forfait', priceHT: 75, vatRate: 10, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(78) },
  { id: 'a35', name: 'Mise en conformité gaz', description: 'Contrôle et remplacement flexible', type: 'service', reference: 'SERV-31', unit: 'forfait', priceHT: 210, vatRate: 10, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(79) },
  { id: 'a36', name: 'Contrat robinetterie', description: 'Visite semestrielle', type: 'abonnement', reference: 'ABO-03', unit: 'mois', priceHT: 6.5, vatRate: 20, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(81) },
  { id: 'a37', name: 'Réducteur de pression', description: 'Laiton, 20/27', type: 'produit', reference: 'PR-058', unit: 'unité', priceHT: 46, vatRate: 20, purchasePrice: 24, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(82) },
  { id: 'a38', name: 'Heure de soudure', description: 'Brasage cuivre', type: 'main-oeuvre', reference: 'MO-005', unit: 'heure', priceHT: 72, vatRate: 20, category: 'Plomberie', favorite: true, lastUsedAt: daysAgo(84) },
  { id: 'a39', name: 'Pose radiateur', description: 'Fixation et raccordement', type: 'service', reference: 'SERV-33', unit: 'forfait', priceHT: 260, vatRate: 10, category: 'Chauffage', favorite: true, lastUsedAt: daysAgo(85) },
  { id: 'a40', name: 'Radiateur acier 1000 W', description: 'Panneau horizontal blanc', type: 'produit', reference: 'PR-061', unit: 'unité', priceHT: 145, vatRate: 20, purchasePrice: 88, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(87) },
  { id: 'a41', name: 'Location déboucheur haute pression', description: 'Demi-journée', type: 'autre', reference: 'DIV-02', unit: 'forfait', priceHT: 120, vatRate: 20, category: 'Divers', favorite: false, lastUsedAt: daysAgo(88) },
  { id: 'a42', name: 'Pose douche à l’italienne', description: 'Receveur extra-plat et paroi', type: 'service', reference: 'SERV-35', unit: 'forfait', priceHT: 1450, vatRate: 10, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(90) },
  { id: 'a43', name: 'Receveur de douche 90×90', description: 'Extra-plat, blanc', type: 'produit', reference: 'PR-064', unit: 'unité', priceHT: 189, vatRate: 20, purchasePrice: 112, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(92) },
  { id: 'a44', name: 'Colonne de douche', description: 'Thermostatique, chromée', type: 'produit', reference: 'PR-067', unit: 'unité', priceHT: 219, vatRate: 20, purchasePrice: 134, category: 'Sanitaire', favorite: false, lastUsedAt: daysAgo(94) },
  { id: 'a45', name: 'Déplacement zone 2', description: 'Entre 15 et 30 km', type: 'deplacement', reference: 'DEP-04', unit: 'forfait', priceHT: 55, vatRate: 20, category: 'Interventions', favorite: false, lastUsedAt: daysAgo(96) },
  { id: 'a46', name: 'Vidange circuit chauffage', description: 'Purge complète', type: 'service', reference: 'SERV-37', unit: 'forfait', priceHT: 130, vatRate: 10, category: 'Chauffage', favorite: false, lastUsedAt: daysAgo(98) },
  { id: 'a47', name: 'Joint fibre', description: 'Lot de 50', type: 'produit', reference: 'PR-071', unit: 'lot', priceHT: 7.9, vatRate: 20, purchasePrice: 2.8, category: 'Plomberie', favorite: false, lastUsedAt: daysAgo(101) },
  { id: 'a48', name: 'Heure de dépannage de nuit', description: 'Entre 20 h et 7 h', type: 'main-oeuvre', reference: 'MO-008', unit: 'heure', priceHT: 110, vatRate: 20, category: 'Interventions', favorite: false, lastUsedAt: daysAgo(105) },
]
