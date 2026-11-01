import { lireDecimal } from '@/lib/format'
import {
  TAUX_TVA_DEFAUT,
  type Article,
  type ArticleSaisie,
  type TypeArticle,
} from '@shared/articles'

export interface Brouillon {
  nom: string
  reference: string
  type: TypeArticle
  description: string
  unite: string
  prixHt: string
  tva: string
  prixAchat: string
  categorieId: string
  favori: boolean
}

export type Erreurs = Partial<Record<keyof Brouillon, string>>

const texteNombre = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

export function brouillonDe(article: Article | null): Brouillon {
  return {
    nom: article?.nom ?? '',
    reference: article?.reference ?? '',
    type: article?.type ?? 'service',
    description: article?.description ?? '',
    unite: article?.unite ?? 'u',
    prixHt: texteNombre(article?.prixUnitaireHt ?? null),
    tva: texteNombre(article?.tauxTva ?? TAUX_TVA_DEFAUT),
    prixAchat: texteNombre(article?.prixAchatHt ?? null),
    categorieId: article?.categorieId ?? '',
    favori: article?.favori ?? false,
  }
}

/** Champs de l'API vers champs du formulaire. */
export const CHAMP_API: Record<string, keyof Brouillon> = {
  prixUnitaireHt: 'prixHt',
  tauxTva: 'tva',
  prixAchatHt: 'prixAchat',
  categorieId: 'categorieId',
  nom: 'nom',
  reference: 'reference',
  unite: 'unite',
  description: 'description',
}

export function valider(b: Brouillon): Erreurs {
  const e: Erreurs = {}
  if (!b.nom.trim()) e.nom = 'Donnez un nom à l’article.'
  if (!b.unite.trim()) e.unite = 'Indiquez une unité.'
  const ht = lireDecimal(b.prixHt)
  if (ht === null || ht < 0) e.prixHt = 'Saisissez un prix HT valide (0 ou plus).'
  const tva = lireDecimal(b.tva)
  if (tva === null || tva < 0 || tva > 100) e.tva = 'Taux de TVA entre 0 et 100.'
  if (b.prixAchat.trim()) {
    const achat = lireDecimal(b.prixAchat)
    if (achat === null || achat < 0) e.prixAchat = 'Saisissez un prix d’achat valide.'
  }
  return e
}

/** Brouillon valide vers corps d'API ; `actif` vient de l'article édité (création : actif). */
export function versSaisie(b: Brouillon, actif: boolean): ArticleSaisie {
  return {
    nom: b.nom.trim(),
    reference: b.reference.trim() || null,
    type: b.type,
    description: b.description.trim(),
    unite: b.unite.trim(),
    prixUnitaireHt: lireDecimal(b.prixHt) ?? 0,
    tauxTva: lireDecimal(b.tva) ?? 0,
    prixAchatHt: b.prixAchat.trim() ? lireDecimal(b.prixAchat) : null,
    categorieId: b.categorieId ? Number(b.categorieId) : null,
    favori: b.favori,
    actif,
  }
}

/** Saisie complète d'un article existant avec quelques champs changés (archivage). */
export const saisieDe = (a: Article, changes: Partial<ArticleSaisie>): ArticleSaisie => ({
  ...versSaisie(brouillonDe(a), a.actif),
  ...changes,
})
