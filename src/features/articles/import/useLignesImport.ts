import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_LIGNES } from './csv'
import {
  DEFAUTS_INITIAUX, affecterChamp, appliquerCollage, estVide, ligneVide, nouvelId, trierLignes,
  type CleChamp, type Defauts, type LigneImport, type Tri,
} from './modele'
import type { ChampRemplir } from './PanneauxOutils'

const CLE_BROUILLON = 'senova.articles-import.brouillon.v1'
const lignesVides = (n: number, d: Defauts) => Array.from({ length: n }, () => ligneVide(d))

/** Brouillon en sessionStorage : survit à une déconnexion (401) dans le même onglet, jamais au-delà. */
function lireBrouillon(): LigneImport[] {
  try {
    const brut = sessionStorage.getItem(CLE_BROUILLON)
    const donnees: unknown = brut ? JSON.parse(brut) : null
    return Array.isArray(donnees) ? (donnees as LigneImport[]).filter((l) => l && typeof l.id === 'string' && !estVide(l)).slice(0, MAX_LIGNES) : []
  } catch {
    return []
  }
}

function ecrireBrouillon(lignes: readonly LigneImport[]) {
  try {
    const pleines = lignes.filter((l) => !estVide(l))
    if (pleines.length) sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(pleines))
    else sessionStorage.removeItem(CLE_BROUILLON)
  } catch {
    /* stockage indisponible ou plein : le brouillon est un confort, pas une garantie */
  }
}

/** Écran démonté pendant l'envoi : le brouillon écrit au démontage contient encore les lignes déjà créées, on les en retire. */
export function retirerDuBrouillon(ids: readonly string[]) {
  const crees = new Set(ids)
  ecrireBrouillon(lireBrouillon().filter((l) => !crees.has(l.id)))
}

/** État du tableau de saisie : lignes, sélection, tri, valeurs par défaut, brouillon, et toutes les actions sur les lignes. */
export function useLignesImport() {
  const [defauts, setDefauts] = useState(DEFAUTS_INITIAUX)
  const [initiales] = useState(lireBrouillon)
  const [lignes, setLignes] = useState<LigneImport[]>(() => (initiales.length ? [...initiales, ligneVide(DEFAUTS_INITIAUX)] : lignesVides(5, DEFAUTS_INITIAUX)))
  /** Nombre de lignes reprises du brouillon ; null une fois le bandeau fermé. */
  const [restaure, setRestaure] = useState<number | null>(initiales.length || null)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [tri, setTri] = useState<Tri | null>(null)

  // Écriture différée à chaque changement ; écriture immédiate au démontage (session perdue, navigation).
  const derniere = useRef(lignes)
  useEffect(() => {
    derniere.current = lignes
    const minuteur = setTimeout(() => ecrireBrouillon(lignes), 500)
    return () => clearTimeout(minuteur)
  }, [lignes])
  useEffect(() => () => ecrireBrouillon(derniere.current), [])

  const changer = useCallback((id: string, cle: CleChamp, valeur: string | boolean) => {
    setLignes((liste) => liste.map((l) => (l.id === id ? ({ ...l, [cle]: valeur, echec: undefined } as LigneImport) : l)))
  }, [])

  /** Renvoie le nombre de lignes réellement ajoutées (plafond de MAX_LIGNES). */
  const ajouter = useCallback((n: number) => {
    const possibles = Math.max(0, Math.min(n, MAX_LIGNES - lignes.length))
    if (possibles) setLignes((liste) => [...liste, ...lignesVides(possibles, defauts)])
    return possibles
  }, [defauts, lignes.length])

  const supprimerSelection = () => {
    const reste = lignes.filter((l) => !selection.has(l.id))
    setLignes(reste.length ? reste : lignesVides(1, defauts))
    setSelection(new Set())
    return lignes.length - reste.length
  }

  const dupliquerSelection = () => {
    const copies = lignes.flatMap((l) => (selection.has(l.id) ? [l, { ...l, id: nouvelId(), reference: '', echec: undefined }] : [l]))
    if (copies.length > MAX_LIGNES) return 0
    setLignes(copies)
    return selection.size
  }

  const remplir = (cle: ChampRemplir, valeur: string, portee: 'selection' | 'toutes', videsSeulement: boolean) => {
    let n = 0
    setLignes(lignes.map((l) => {
      if (portee === 'selection' ? !selection.has(l.id) : estVide(l)) return l
      if (videsSeulement && cle !== 'favori' && String(l[cle]).trim()) return l
      n++
      return { ...affecterChamp(l, cle, valeur, defauts), echec: undefined }
    }))
    return n
  }

  const changerDefauts = (patch: Partial<Defauts>) => {
    const suivants = { ...defauts, ...patch }
    setDefauts(suivants)
    setLignes((liste) => liste.map((l) => (estVide(l) ? { ...l, type: suivants.type, unite: suivants.unite, tva: suivants.tva, categorie: suivants.categorie } : l)))
  }

  const trier = (cle: CleChamp) => {
    const suivant: Tri = { cle, sens: tri?.cle === cle && tri.sens === 'asc' ? 'desc' : 'asc' }
    setTri(suivant)
    setLignes((liste) => trierLignes(liste, suivant))
  }

  /** Peut lever `ErreurTableau` (limite de lignes). */
  const coller = (r: number, c: number, texte: string, colonnesNav: readonly CleChamp[]) => {
    const res = appliquerCollage(lignes, r, c, texte, colonnesNav, defauts)
    setLignes(res.lignes)
    return res
  }

  /** Ajoute des lignes importées en remplaçant les lignes vides. Renvoie false si la limite est dépassée. */
  const ajouterImportees = (nouvelles: LigneImport[]) => {
    const pleines = lignes.filter((l) => !estVide(l))
    if (pleines.length + nouvelles.length > MAX_LIGNES) return false
    setLignes([...pleines, ...nouvelles, ...lignesVides(1, defauts)])
    setTri(null)
    return true
  }

  /** Après l'envoi : les lignes créées disparaissent, les échecs gardent leur message. Mise à jour fonctionnelle : jamais d'état périmé. */
  const appliquerBilan = (crees: ReadonlySet<string>, echecs: ReadonlyMap<string, string>) => {
    setLignes((liste) => {
      const reste = liste.filter((l) => !crees.has(l.id)).map((l) => (echecs.has(l.id) ? { ...l, echec: echecs.get(l.id) } : l))
      return reste.some(estVide) ? reste : [...reste, ...lignesVides(1, defauts)]
    })
    setSelection(new Set())
    setRestaure(null)
  }

  const vider = () => {
    setLignes(lignesVides(5, defauts))
    setSelection(new Set())
    setRestaure(null)
    ecrireBrouillon([])
  }

  return {
    defauts, lignes, selection, tri, restaure, setSelection, changer, ajouter, supprimerSelection, dupliquerSelection,
    remplir, changerDefauts, trier, coller, ajouterImportees, appliquerBilan, vider, fermerBandeau: () => setRestaure(null),
  }
}
