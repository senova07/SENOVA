/** Modèle de l'ajout en masse : lignes éditables, normalisation, validation, conversion vers l'API. Fonctions pures. */
import {
  LIBELLES_TYPE_ARTICLE,
  TAUX_TVA,
  TYPES_ARTICLE,
  UNITES_PAR_DEFAUT,
  type ArticleSaisie,
  type CategorieArticle,
  type TypeArticle,
} from '@shared/articles'
import { analyserCollage, ErreurTableau, MAX_LIGNES, messageTropDeLignes, type Matrice } from './csv'

export type CleChamp = 'nom' | 'type' | 'reference' | 'categorie' | 'unite' | 'prix' | 'tva' | 'achat' | 'favori'

export interface LigneImport {
  id: string
  nom: string
  /** Chaîne vide : type collé non reconnu (signalé, jamais remplacé en silence). */
  type: TypeArticle | ''
  reference: string
  categorie: string
  unite: string
  prix: string
  /** Taux en texte : `'20'`, `'5.5'`. */
  tva: string
  achat: string
  favori: boolean
  /** Message d'erreur renvoyé par l'API au dernier envoi. */
  echec?: string
}

export type ErreursLigne = Partial<Record<CleChamp, string>>

export interface Defauts {
  type: TypeArticle
  unite: string
  tva: string
  categorie: string
}

export const DEFAUTS_INITIAUX: Defauts = { type: 'service', unite: 'u', tva: '20', categorie: '' }

export interface ColonneDef {
  cle: CleChamp
  libelle: string
  genre: 'texte' | 'choix' | 'nombre' | 'etoile'
  largeur: number
  obligatoire?: boolean
  masquable?: boolean
  triable?: boolean
}

export const COLONNES: readonly ColonneDef[] = [
  { cle: 'nom', libelle: "Nom de l'article", genre: 'texte', largeur: 230, obligatoire: true, triable: true },
  { cle: 'type', libelle: 'Type', genre: 'choix', largeur: 170, obligatoire: true, triable: true },
  { cle: 'reference', libelle: 'Référence', genre: 'texte', largeur: 120, masquable: true, triable: true },
  { cle: 'categorie', libelle: 'Catégorie', genre: 'choix', largeur: 150, masquable: true, triable: true },
  { cle: 'unite', libelle: 'Unité', genre: 'texte', largeur: 100, masquable: true, triable: true },
  { cle: 'prix', libelle: 'Prix HT', genre: 'nombre', largeur: 110, obligatoire: true, triable: true },
  { cle: 'tva', libelle: 'TVA', genre: 'choix', largeur: 96, masquable: true, triable: true },
  { cle: 'achat', libelle: "Prix d'achat", genre: 'nombre', largeur: 112, masquable: true, triable: true },
  { cle: 'favori', libelle: 'Favori', genre: 'etoile', largeur: 64, masquable: true },
]

export const LIBELLE_CHAMP = Object.fromEntries(COLONNES.map((c) => [c.cle, c.libelle])) as Record<CleChamp, string>

export const libelleTva = (tva: string): string => `${tva.replace('.', ',')} %`

/* ───── Lignes ───── */

let sequence = 0
export const nouvelId = (): string => `l${Date.now().toString(36)}${(sequence++).toString(36)}`

export const ligneVide = (d: Defauts): LigneImport => ({
  id: nouvelId(),
  nom: '',
  type: d.type,
  reference: '',
  categorie: d.categorie,
  unite: d.unite,
  prix: '',
  tva: d.tva,
  achat: '',
  favori: false,
})

export const estVide = (l: LigneImport): boolean => !l.nom.trim() && !l.reference.trim() && !l.prix.trim() && !l.achat.trim()

/* ───── Normalisation ───── */

export const normaliser = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** « 12,50 € », « 1.234,50 », « 65 » : nombre positif ou nul, null si illisible. */
export function lireMontant(brut: string): number | null {
  const t = brut.replace(/eur|€|[\s\u00a0\u202f]/gi, '')
  if (!/^\d[\d.,]*$/.test(t)) return null
  // Le dernier séparateur rencontré est le séparateur décimal ; l'autre ne peut être qu'un séparateur de milliers.
  const i = Math.max(t.lastIndexOf(','), t.lastIndexOf('.'))
  if (i < 0) return Number(t)
  const sep = t[i]!
  const autre = sep === ',' ? '.' : ','
  const regroupe = (s: string, mil: string): string | null => {
    const g = s.split(mil)
    return /^\d{1,3}$/.test(g[0]!) && g.slice(1).every((x) => /^\d{3}$/.test(x)) ? g.join('') : null
  }
  // « 1.234.567 » : que des milliers, pas de décimales.
  if (t.slice(0, i).includes(sep)) {
    const entier = regroupe(t, sep)
    return entier === null ? null : Number(entier)
  }
  const dec = t.slice(i + 1)
  if (!/^\d+$/.test(dec)) return null
  let entier = t.slice(0, i)
  if (entier.includes(autre)) {
    const g = regroupe(entier, autre)
    if (g === null) return null
    entier = g
  } else if (dec.length === 3 && /^[1-9]\d{0,2}$/.test(entier)) {
    return null // « 1.234 » ou « 1,234 » : milliers ou décimales ? On refuse plutôt que de deviner.
  }
  return Number(`${entier}.${dec}`)
}

export const formaterMontant = (n: number): string => n.toFixed(2).replace('.', ',')

const SYNONYMES_TYPE: Record<string, TypeArticle> = {
  prestation: 'service',
  services: 'service',
  produits: 'produit',
  fourniture: 'produit',
  fournitures: 'produit',
  materiel: 'produit',
  mo: 'main_oeuvre',
  'main d oeuvre': 'main_oeuvre',
  maindoeuvre: 'main_oeuvre',
  deplacements: 'deplacement',
  transport: 'deplacement',
  abonnements: 'abonnement',
  contrat: 'abonnement',
  pack: 'forfait',
  'pack / forfait': 'forfait',
  divers: 'autre',
}

const TABLE_TYPES: Record<string, TypeArticle> = {
  ...SYNONYMES_TYPE,
  ...Object.fromEntries(
    TYPES_ARTICLE.flatMap((t) => [
      [normaliser(t.replace('_', ' ')), t],
      [normaliser(LIBELLES_TYPE_ARTICLE[t]), t],
    ]),
  ),
}

/** Libellé, identifiant ou synonyme → type ; vide → repli ; inconnu → chaîne vide (à corriger). */
export function lireType(brut: string, repli: TypeArticle | ''): TypeArticle | '' {
  const k = normaliser(brut)
  if (!k) return repli
  return TABLE_TYPES[k] ?? TABLE_TYPES[k.replace(/-/g, ' ')] ?? TABLE_TYPES[k.replace(/[- ]/g, '')] ?? ''
}

/** « 20 % », « 5,5 », « 0,2 » → `'20'`, `'5.5'`. Valeur inconnue conservée telle quelle (signalée). */
export function lireTva(brut: string): string {
  const s = brut.replace(/[\s%]/g, '').replace(',', '.')
  if (!s) return ''
  let n = Number(s)
  if (!Number.isFinite(n)) return brut.trim()
  if (n > 0 && n < 1) n = Math.round(n * 1000) / 10
  return (TAUX_TVA as readonly number[]).includes(n) ? String(n) : brut.trim()
}

const SYNONYMES_UNITE: Record<string, string> = {
  heure: 'h', heures: 'h', hr: 'h',
  unite: 'u', unites: 'u', pce: 'u', piece: 'u', pieces: 'u', ens: 'u',
  jour: 'j', jours: 'j',
  ft: 'forfait', fft: 'forfait',
  m2: 'm²',
  metre: 'ml', metres: 'ml',
  m3: 'm³',
  kilo: 'kg', kilos: 'kg',
}

export function lireUnite(brut: string, repli: string): string {
  const k = normaliser(brut)
  if (!k) return repli
  return SYNONYMES_UNITE[k] ?? UNITES_PAR_DEFAUT.find((u) => normaliser(u) === k) ?? brut.trim()
}

export const lireFavori = (brut: string): boolean => /^(oui|yes|true|vrai|1|x|★)$/i.test(brut.trim())

/** Applique une valeur texte (collée, importée) à un champ en la normalisant. */
export function affecterChamp(ligne: LigneImport, cle: CleChamp, brut: string, d: Defauts): LigneImport {
  switch (cle) {
    case 'type': return { ...ligne, type: lireType(brut, d.type) }
    case 'tva': return { ...ligne, tva: lireTva(brut) || ligne.tva }
    case 'unite': return { ...ligne, unite: lireUnite(brut, ligne.unite) }
    case 'favori': return { ...ligne, favori: lireFavori(brut) }
    case 'prix':
    case 'achat': {
      const n = lireMontant(brut)
      return { ...ligne, [cle]: n === null ? brut.trim() : formaterMontant(n) }
    }
    default: return { ...ligne, [cle]: brut.trim() }
  }
}

/* ───── Validation ───── */

export const trouverCategorie = (nom: string, categories: readonly CategorieArticle[]): CategorieArticle | undefined => {
  const k = normaliser(nom)
  return k ? categories.find((c) => normaliser(c.nom) === k) : undefined
}

export function validerLignes(lignes: readonly LigneImport[], categories: readonly CategorieArticle[]): Map<string, ErreursLigne> {
  const sortie = new Map<string, ErreursLigne>()
  const comptes = new Map<string, number>()
  for (const l of lignes) {
    const ref = l.reference.trim().toUpperCase()
    if (!estVide(l) && ref) comptes.set(ref, (comptes.get(ref) ?? 0) + 1)
  }
  for (const l of lignes) {
    if (estVide(l)) continue
    const e: ErreursLigne = {}
    if (!l.nom.trim()) e.nom = 'Nom obligatoire'
    if (!l.type) e.type = 'Type inconnu'
    if (!l.prix.trim()) e.prix = 'Prix obligatoire'
    else if (lireMontant(l.prix) === null) e.prix = 'Prix incorrect ou ambigu'
    if (l.achat.trim() && lireMontant(l.achat) === null) e.achat = 'Prix incorrect ou ambigu'
    if (!(TAUX_TVA as readonly number[]).includes(Number(l.tva))) e.tva = 'TVA invalide'
    if (l.categorie.trim() && !trouverCategorie(l.categorie, categories)) e.categorie = 'Catégorie inconnue : créez-la dans Articles'
    if ((comptes.get(l.reference.trim().toUpperCase()) ?? 0) > 1) e.reference = 'Référence en double'
    if (Object.keys(e).length) sortie.set(l.id, e)
  }
  return sortie
}

/** Ligne déjà validée → corps de `POST /articles`. */
export function versSaisie(l: LigneImport, categories: readonly CategorieArticle[]): ArticleSaisie {
  return {
    reference: l.reference.trim() || null,
    nom: l.nom.trim(),
    type: l.type as TypeArticle,
    unite: l.unite.trim() || 'u',
    prixUnitaireHt: lireMontant(l.prix) ?? 0,
    tauxTva: Number(l.tva),
    prixAchatHt: l.achat.trim() ? lireMontant(l.achat) : null,
    categorieId: trouverCategorie(l.categorie, categories)?.id ?? null,
    favori: l.favori,
  }
}

/* ───── Tri ───── */

export interface Tri {
  cle: CleChamp
  sens: 'asc' | 'desc'
}

/** Les lignes vides restent en bas. */
export function trierLignes(lignes: readonly LigneImport[], { cle, sens }: Tri): LigneImport[] {
  const valeur = (l: LigneImport): string | number => {
    if (cle === 'prix' || cle === 'achat') return lireMontant(l[cle]) ?? -1
    if (cle === 'tva') return Number(l.tva) || 0
    if (cle === 'type') return l.type ? LIBELLES_TYPE_ARTICLE[l.type] : ''
    return String(l[cle])
  }
  const pleines = lignes.filter((l) => !estVide(l))
  pleines.sort((a, b) => {
    const [va, vb] = [valeur(a), valeur(b)]
    const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' })
    return sens === 'asc' ? c : -c
  })
  return [...pleines, ...lignes.filter(estVide)]
}

/* ───── Association des colonnes d'un fichier ───── */

const SYNONYMES_ENTETE: Record<CleChamp, string[]> = {
  nom: ['nom', 'designation', 'libelle', 'article', 'intitule', 'produit', 'nom de larticle'],
  type: ['type', 'nature', 'genre'],
  reference: ['reference', 'ref', 'code', 'code article', 'sku', 'ref interne'],
  categorie: ['categorie', 'famille', 'rayon', 'groupe', 'gamme'],
  unite: ['unite', 'u', 'conditionnement', 'unite de vente'],
  prix: ['prix ht', 'pu ht', 'prix unitaire ht', 'prix de vente', 'prix', 'pu', 'tarif', 'prix vente ht'],
  tva: ['tva', 'taux tva', 'taux de tva', 'tx tva'],
  achat: ['prix dachat', 'prix achat', 'pa ht', 'cout', 'prix de revient', 'achat ht'],
  favori: ['favori', 'favoris'],
}

export function deviner(entete: string): CleChamp | null {
  const h = normaliser(entete)
  if (!h) return null
  const entrees = Object.entries(SYNONYMES_ENTETE) as [CleChamp, string[]][]
  // La correspondance la plus longue gagne, tous champs confondus : « Prix d'achat HT » → achat, pas prix.
  let meilleur: { cle: CleChamp; score: number } | null = null
  for (const [cle, synonymes] of entrees) {
    for (const s of synonymes) {
      const score = s === h ? 1000 + s.length : s.length > 2 && h.includes(s) ? s.length : 0
      if (score > (meilleur?.score ?? 0)) meilleur = { cle, score }
    }
  }
  return meilleur?.cle ?? null
}

/** Au moins deux colonnes reconnues et aucune valeur numérique. */
export const ressembleEntetes = (ligne: readonly string[]): boolean =>
  ligne.filter((c) => deviner(c)).length >= 2 && !ligne.some((c) => lireMontant(c) !== null)

export type Cible = CleChamp | 'ignorer'

/** Avec en-têtes : par synonymes (un champ une seule fois) ; sans : dans l'ordre des colonnes SENOVA. */
export function correspondanceAuto(matrice: Matrice, avecEntete: boolean): Cible[] {
  const largeur = Math.max(0, ...matrice.map((l) => l.length))
  if (!avecEntete) return Array.from({ length: largeur }, (_, j) => COLONNES[j]?.cle ?? 'ignorer')
  const vus = new Set<CleChamp>()
  return Array.from({ length: largeur }, (_, j) => {
    const g = deviner(matrice[0]?.[j] ?? '')
    if (!g || vus.has(g)) return 'ignorer'
    vus.add(g)
    return g
  })
}

export function construireLignes(donnees: Matrice, cibles: readonly Cible[], d: Defauts): LigneImport[] {
  return donnees
    .map((ligne) =>
      ligne.reduce((acc, val, j) => {
        const cible = cibles[j]
        return cible && cible !== 'ignorer' ? affecterChamp(acc, cible, val, d) : acc
      }, ligneVide(d)),
    )
    .filter((l) => !estVide(l))
}

/** Collage multi-cellules à partir de la cellule (r, c) ; `colonnesNav` : colonnes atteignables au clavier. */
export function appliquerCollage(
  lignes: readonly LigneImport[],
  r: number,
  c: number,
  texte: string,
  colonnesNav: readonly CleChamp[],
  d: Defauts,
): { lignes: LigneImport[]; nombre: number; reconnues?: string[] } {
  let matrice = analyserCollage(texte)
  let cibles: (CleChamp | null)[]
  let reconnues: string[] | undefined
  if (matrice.length > 1 && ressembleEntetes(matrice[0]!)) {
    cibles = matrice[0]!.map(deviner)
    reconnues = cibles.filter((k): k is CleChamp => k !== null).map((k) => LIBELLE_CHAMP[k])
    matrice = matrice.slice(1)
  } else cibles = (matrice[0] ?? []).map((_, j) => colonnesNav[c + j] ?? null)
  if (r + matrice.length > MAX_LIGNES) throw new ErreurTableau(messageTropDeLignes(r + matrice.length))
  const suite = [...lignes]
  matrice.forEach((brute, i) => {
    while (r + i >= suite.length) suite.push(ligneVide(d))
    suite[r + i] = brute.reduce((acc, val, j) => {
      const cle = cibles[j]
      return cle ? { ...affecterChamp(acc, cle, val, d), echec: undefined } : acc
    }, suite[r + i]!)
  })
  return { lignes: suite, nombre: matrice.length, reconnues }
}
