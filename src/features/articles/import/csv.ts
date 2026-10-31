/** Lecture de tableaux CSV / TSV / texte collé, sans dépendance. Les fichiers Excel ne sont pas lus. */

export type Matrice = string[][]

export const MESSAGE_EXCEL =
  'Les fichiers Excel arrivent bientôt. Enregistrez votre feuille en CSV (Fichier > Enregistrer sous) ou copiez-collez les cellules.'

export const MAX_OCTETS = 2 * 1024 * 1024
export const MAX_LIGNES = 2000

/** Tableau refusé (trop gros, guillemet non fermé) : le message est fait pour être affiché tel quel. */
export class ErreurTableau extends Error {}

export const messageTropDeLignes = (n: number): string =>
  `Trop de lignes (${n}) : la limite est de ${MAX_LIGNES} lignes. Découpez votre fichier en plusieurs parties.`

const SEPARATEURS = ['\t', ';', ','] as const

export const estFichierExcel = (nom: string): boolean => /\.(xlsx|xlsm|xlsb|xls|ods)$/i.test(nom)
export const estFichierTexte = (nom: string): boolean => /\.(csv|tsv|txt)$/i.test(nom)

/** Séparateur le plus fréquent de la première ligne, hors guillemets (tabulation, `;` puis `,` à égalité). */
export function detecterSeparateur(texte: string): string {
  const compte: Record<string, number> = { '\t': 0, ';': 0, ',': 0 }
  let entre = false
  for (const c of texte) {
    if (c === '"') entre = !entre
    else if (!entre && (c === '\n' || c === '\r')) break
    else if (!entre && c in compte) compte[c] = (compte[c] ?? 0) + 1
  }
  return SEPARATEURS.reduce((meilleur, s) => ((compte[s] ?? 0) > (compte[meilleur] ?? 0) ? s : meilleur), SEPARATEURS[0])
}

/** CSV/TSV : BOM, CRLF, guillemets (`""` échappé, retours à la ligne permis). Lignes entièrement vides ignorées. */
export function analyserCsv(brut: string): Matrice {
  const texte = brut.replace(/^\ufeff/, '').replace(/\r\n?/g, '\n')
  if (!texte.trim()) return []
  const sep = detecterSeparateur(texte)
  const lignes: Matrice = []
  let ligne: string[] = []
  let cellule = ''
  let entre = false
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]!
    if (entre) {
      if (c === '"' && texte[i + 1] === '"') {
        cellule += '"'
        i++
      } else if (c === '"') entre = false
      else cellule += c
    } else if (c === '"' && cellule === '') entre = true
    else if (c === sep) {
      ligne.push(cellule)
      cellule = ''
    } else if (c === '\n') {
      ligne.push(cellule)
      lignes.push(ligne)
      ligne = []
      cellule = ''
      if (lignes.length > MAX_LIGNES + 1) throw new ErreurTableau(messageTropDeLignes(lignes.length))
    } else cellule += c
  }
  if (entre) throw new ErreurTableau('Fichier invalide : un guillemet est ouvert mais jamais refermé. Vérifiez les cellules entre guillemets.')
  ligne.push(cellule)
  lignes.push(ligne)
  const utiles = lignes.filter((l) => l.some((c) => c.trim()))
  if (utiles.length > MAX_LIGNES + 1) throw new ErreurTableau(messageTropDeLignes(utiles.length))
  return utiles
}

/** Collage depuis un tableur : tabulations et retours à la ligne, sans gestion des guillemets. */
export function analyserCollage(texte: string): Matrice {
  const lignes = texte.replace(/\r\n?/g, '\n').split('\n')
  // Boucle plutôt que `replace(/\n+$/, '')` : cette regex est quadratique sur une longue suite de retours à la ligne.
  while (lignes.length && lignes[lignes.length - 1] === '') lignes.pop()
  if (lignes.length > MAX_LIGNES + 1) throw new ErreurTableau(messageTropDeLignes(lignes.length))
  return lignes.map((l) => l.split('\t'))
}

/** UTF-8, sinon Windows-1252 (export Excel français). */
export function decoderTexte(tampon: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(tampon)
  } catch {
    return new TextDecoder('windows-1252').decode(tampon)
  }
}
