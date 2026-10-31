import type { Icon } from '@phosphor-icons/react'
import {
  BriefcaseIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderSimpleIcon,
  GearIcon,
  HandshakeIcon,
  HouseIcon,
  LightningIcon,
  PackageIcon,
  PlugsConnectedIcon,
  ReceiptIcon,
  UsersIcon,
  UsersThreeIcon,
  WalletIcon,
} from '@phosphor-icons/react'
import type { Permission } from '@shared/permissions'
import type { NomIcone } from '@/ui/Icone'

export interface EntreeNavigation {
  chemin: string
  libelle: string
  icone: Icon
  /** Absente : visible par tous. Présente : visible si `peut(permission)`. */
  permission?: Permission
  /** `false` : pas encore d'écran, la route affiche « Bientôt ». */
  disponible: boolean
  /** Pictogramme de la page « Bientôt » (catalogue `Icone`). */
  iconePage?: NomIcone
}

export interface GroupeNavigation {
  id: string
  libelle?: string
  entrees: readonly EntreeNavigation[]
}

export const GROUPES_NAVIGATION: readonly GroupeNavigation[] = [
  {
    id: 'principal',
    entrees: [
      { chemin: '/', libelle: 'Aujourd’hui', icone: HouseIcon, disponible: true },
      { chemin: '/clients', libelle: 'Clients', icone: UsersIcon, permission: 'clients.voir', disponible: true },
      { chemin: '/prestations', libelle: 'Prestations', icone: BriefcaseIcon, disponible: false, iconePage: 'prestations' },
    ],
  },
  {
    id: 'ventes',
    libelle: 'Ventes',
    entrees: [
      { chemin: '/devis', libelle: 'Devis', icone: FileTextIcon, permission: 'devis.voir', disponible: true },
      { chemin: '/factures', libelle: 'Factures', icone: ReceiptIcon, permission: 'factures.voir', disponible: false, iconePage: 'factures' },
      { chemin: '/paiements', libelle: 'Paiements', icone: CreditCardIcon, permission: 'paiements.voir', disponible: false, iconePage: 'paiements' },
    ],
  },
  {
    id: 'catalogue',
    libelle: 'Catalogue',
    entrees: [
      { chemin: '/articles', libelle: 'Articles', icone: PackageIcon, permission: 'articles.voir', disponible: true },
      { chemin: '/documents', libelle: 'Documents', icone: FolderSimpleIcon, disponible: false, iconePage: 'documents' },
    ],
  },
  {
    id: 'plus',
    libelle: 'Plus',
    entrees: [
      { chemin: '/depenses', libelle: 'Dépenses', icone: WalletIcon, disponible: false, iconePage: 'depenses' },
      { chemin: '/partenaires', libelle: 'Partenaires', icone: HandshakeIcon, disponible: false, iconePage: 'fournisseurs' },
      { chemin: '/equipe', libelle: 'Équipe', icone: UsersThreeIcon, permission: 'equipe.gerer', disponible: false, iconePage: 'equipe' },
      { chemin: '/automatisations', libelle: 'Automatisations', icone: LightningIcon, disponible: false, iconePage: 'automatisations' },
      { chemin: '/integrations', libelle: 'Intégrations', icone: PlugsConnectedIcon, disponible: false, iconePage: 'integrations' },
    ],
  },
]

/** Entrée du bas de la barre latérale. */
export const ENTREE_PARAMETRES: EntreeNavigation = {
  chemin: '/parametres',
  libelle: 'Paramètres',
  icone: GearIcon,
  permission: 'organisation.gerer',
  disponible: false,
  iconePage: 'parametres',
}

/** Toutes les entrées, pour déclarer les routes. */
export const TOUTES_ENTREES: readonly EntreeNavigation[] = [
  ...GROUPES_NAVIGATION.flatMap((g) => g.entrees),
  ENTREE_PARAMETRES,
]

export function entreeVisible(entree: EntreeNavigation, peut: (permission: Permission) => boolean): boolean {
  return !entree.permission || peut(entree.permission)
}

/** Groupes réduits aux entrées permises ; un groupe vide disparaît. */
export function groupesVisibles(
  peut: (permission: Permission) => boolean,
): GroupeNavigation[] {
  return GROUPES_NAVIGATION.map((g) => ({ ...g, entrees: g.entrees.filter((e) => entreeVisible(e, peut)) })).filter(
    (g) => g.entrees.length > 0,
  )
}
