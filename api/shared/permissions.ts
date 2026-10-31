/**
 * Catalogue des permissions de SENOVA.
 *
 * Les permissions sont du code : chacune protège une route de l'API et un
 * écran de l'interface. Les rôles, eux, sont des données propres à chaque
 * organisation. Ce fichier est partagé par l'API et l'interface : la route qui
 * refuse et le menu qui masque lisent la même liste.
 *
 * Contrat pur : aucune dépendance Adonis.
 */

export const PERMISSIONS = [
  'clients.voir',
  'clients.gerer',

  'articles.voir',
  'articles.gerer',

  // Déclarées pour les lots suivants.
  'devis.voir',
  'devis.gerer',
  'factures.voir',
  'factures.gerer',
  'paiements.voir',
  'paiements.gerer',

  'equipe.gerer',
  'organisation.gerer',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export function estPermission(valeur: string): valeur is Permission {
  return (PERMISSIONS as readonly string[]).includes(valeur)
}

/** Rôles créés pour chaque nouvelle organisation (Owner / Admin / Employee / Accountant). */
export interface RoleParDefaut {
  nom: string
  description: string
  proprietaire: boolean
  permissions: readonly Permission[]
}

export const ROLES_PAR_DEFAUT: readonly RoleParDefaut[] = [
  {
    nom: 'Propriétaire',
    description: "Accès complet à l'organisation.",
    proprietaire: true,
    permissions: PERMISSIONS,
  },
  {
    nom: 'Admin',
    description: "Gère l'organisation, l'équipe et toute l'activité.",
    proprietaire: false,
    permissions: PERMISSIONS,
  },
  {
    nom: 'Employé',
    description: 'Travaille sur les clients, articles, devis et factures.',
    proprietaire: false,
    permissions: [
      'clients.voir',
      'clients.gerer',
      'articles.voir',
      'articles.gerer',
      'devis.voir',
      'devis.gerer',
      'factures.voir',
    ],
  },
  {
    nom: 'Comptable',
    description: 'Consulte les données et gère factures et paiements.',
    proprietaire: false,
    permissions: [
      'clients.voir',
      'articles.voir',
      'devis.voir',
      'factures.voir',
      'factures.gerer',
      'paiements.voir',
      'paiements.gerer',
    ],
  },
]
