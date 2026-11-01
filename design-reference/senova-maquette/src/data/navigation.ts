import type { Icon } from '@phosphor-icons/react'
import {
  HouseIcon, UsersIcon, BriefcaseIcon, FileTextIcon, ReceiptIcon, CreditCardIcon,
  PackageIcon, FolderSimpleIcon, WalletIcon, HandshakeIcon, UsersThreeIcon,
  LightningIcon, PlugsConnectedIcon,
} from '@phosphor-icons/react'

export type PageId =
  | 'aujourdhui' | 'clients' | 'prestations'
  | 'devis' | 'factures' | 'paiements'
  | 'articles' | 'documents'
  | 'depenses' | 'partenaires' | 'equipe' | 'automatisations' | 'integrations'
  | 'parametres'
  /** Sous-pages (hors menu) */
  | 'articles-import' | 'devis-nouveau' | 'documents-apparence'

export interface NavItem {
  id: PageId
  label: string
  icon: Icon
  /** Compteur discret affiché à droite (éléments à traiter) */
  count?: number
  countTone?: 'default' | 'alert'
}

export interface NavGroup {
  id: string
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'aujourdhui', label: 'Aujourd’hui', icon: HouseIcon, count: 4 },
      { id: 'clients', label: 'Clients', icon: UsersIcon },
      { id: 'prestations', label: 'Prestations', icon: BriefcaseIcon },
    ],
  },
  {
    id: 'ventes',
    label: 'Ventes',
    items: [
      { id: 'devis', label: 'Devis', icon: FileTextIcon, count: 2 },
      { id: 'factures', label: 'Factures', icon: ReceiptIcon, count: 1, countTone: 'alert' },
      { id: 'paiements', label: 'Paiements', icon: CreditCardIcon },
    ],
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    items: [
      { id: 'articles', label: 'Articles', icon: PackageIcon },
      { id: 'documents', label: 'Documents', icon: FolderSimpleIcon },
    ],
  },
  {
    id: 'plus',
    label: 'Plus',
    items: [
      { id: 'depenses', label: 'Dépenses', icon: WalletIcon },
      { id: 'partenaires', label: 'Partenaires', icon: HandshakeIcon },
      { id: 'equipe', label: 'Équipe', icon: UsersThreeIcon },
      { id: 'automatisations', label: 'Automatisations', icon: LightningIcon },
      { id: 'integrations', label: 'Intégrations', icon: PlugsConnectedIcon },
    ],
  },
]

export const PAGE_LABELS: Record<PageId, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label])).concat([['parametres', 'Paramètres'], ['articles-import', 'Ajout en masse'], ['devis-nouveau', 'Nouveau devis'], ['documents-apparence', 'Apparence des documents']]),
) as Record<PageId, string>

export const PAGE_SECTION: Partial<Record<PageId, string>> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => (g.label ? g.items.map((i) => [i.id, g.label]) : [])),
)

/** Entrée de menu à mettre en surbrillance pour une page donnée (les sous-pages héritent de leur parent). */
export const NAV_PARENT: Partial<Record<PageId, PageId>> = { 'articles-import': 'articles', 'devis-nouveau': 'devis', 'documents-apparence': 'documents' }
