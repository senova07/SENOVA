import type { NomIcone } from '@/ui/Icone'

export interface EntreeNav {
  chemin: string
  libelle: string
  icone: NomIcone
}

/** Rubrique de la sidebar : soit une page (`chemin`), soit un groupe de sous-pages (`enfants`). */
export interface RubriqueNav {
  id: string
  libelle: string
  icone: NomIcone
  chemin?: string
  enfants?: readonly EntreeNav[]
}

// shortcut: toutes les entrées sont visibles, sans filtre par permission ; filtrer
// via session.permissions quand les écrans Devis/Factures/Paiements existeront.
// Règle : 2 niveaux au plus dans la sidebar ; au-delà, des onglets dans la page.
export const NAVIGATION: readonly RubriqueNav[] = [
  { id: 'aujourdhui', libelle: "Aujourd'hui", icone: 'aujourdhui', chemin: '/' },
  { id: 'clients', libelle: 'Clients', icone: 'clients', chemin: '/clients' },
  {
    id: 'ventes',
    libelle: 'Ventes',
    icone: 'ventes',
    enfants: [
      { chemin: '/devis', libelle: 'Devis', icone: 'devis' },
      { chemin: '/factures', libelle: 'Factures', icone: 'factures' },
      { chemin: '/avoirs', libelle: 'Avoirs', icone: 'avoirs' },
      { chemin: '/paiements', libelle: 'Paiements', icone: 'paiements' },
      { chemin: '/relances', libelle: 'Relances', icone: 'relances' },
    ],
  },
  { id: 'prestations', libelle: 'Prestations', icone: 'prestations', chemin: '/prestations' },
  {
    id: 'catalogue',
    libelle: 'Catalogue',
    icone: 'articles',
    enfants: [
      { chemin: '/articles', libelle: 'Articles', icone: 'articles' },
      { chemin: '/articles?categories=1', libelle: 'Catégories', icone: 'etiquette' },
      { chemin: '/articles?onglet=forfaits', libelle: 'Packs / forfaits', icone: 'type_forfait' },
    ],
  },
  {
    id: 'achats',
    libelle: 'Achats',
    icone: 'achats',
    enfants: [
      { chemin: '/depenses', libelle: 'Dépenses', icone: 'depenses' },
      { chemin: '/fournisseurs', libelle: 'Fournisseurs', icone: 'fournisseurs' },
    ],
  },
  { id: 'documents', libelle: 'Documents', icone: 'documents', chemin: '/documents' },
  {
    id: 'parametres',
    libelle: 'Paramètres',
    icone: 'parametres',
    enfants: [
      { chemin: '/parametres', libelle: 'Entreprise', icone: 'entreprise' },
      { chemin: '/devis/modeles', libelle: 'Modèles de devis', icone: 'palette' },
      { chemin: '/equipe', libelle: 'Équipe', icone: 'equipe' },
      { chemin: '/automatisations', libelle: 'Automatisations', icone: 'automatisations' },
      { chemin: '/integrations', libelle: 'Intégrations', icone: 'integrations' },
      {
        chemin: '/facturation-electronique',
        libelle: 'Facture électronique',
        icone: 'facturation_electronique',
      },
    ],
  },
]

/** Toutes les pages (feuilles), pour les routes et le menu mobile. */
export const NAV_TOUTES: readonly EntreeNav[] = NAVIGATION.flatMap((r) =>
  r.enfants ?? (r.chemin ? [{ chemin: r.chemin, libelle: r.libelle, icone: r.icone }] : []),
)

/** Entrées de la barre basse mobile ; le reste passe par « Plus ». */
export const CHEMINS_BARRE_MOBILE = ['/', '/clients', '/prestations']

/**
 * Sous-page active d'une rubrique. Une entrée avec paramètres (`?onglet=…`) gagne quand ils sont
 * présents dans l'URL ; sinon c'est l'entrée sans paramètres du même chemin. Une page de détail
 * (`/devis/42`) active sa liste, sauf si une autre entrée correspond exactement (`/devis/modeles`).
 */
export function cheminActif(
  enfants: readonly EntreeNav[],
  pathname: string,
  search: string,
): string | undefined {
  const courants = new URLSearchParams(search)
  const memeChemin = enfants.filter((e) => e.chemin.split('?')[0] === pathname)
  const avecParametres = memeChemin.find((e) => {
    const requete = e.chemin.split('?')[1]
    if (!requete) return false
    return [...new URLSearchParams(requete)].every(([cle, valeur]) => courants.get(cle) === valeur)
  })
  const exact = avecParametres ?? memeChemin.find((e) => !e.chemin.includes('?'))
  if (exact || NAV_TOUTES.some((e) => e.chemin.split('?')[0] === pathname)) return exact?.chemin
  // Préfixe le plus long de toute la navigation, pour que /devis/modeles/3 n'active pas « Devis ».
  const parent = NAV_TOUTES.filter(
    (e) => !e.chemin.includes('?') && pathname.startsWith(`${e.chemin}/`),
  ).sort((a, b) => b.chemin.length - a.chemin.length)[0]
  return enfants.some((e) => e.chemin === parent?.chemin) ? parent?.chemin : undefined
}
