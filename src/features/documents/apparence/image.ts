/** Contrôle et lecture des images importées (logo, photo). */

export interface RegleImage {
  types: readonly string[]
  /** Octets. */
  tailleMax: number
  formats: string
  /** Largeur et hauteur maximales en pixels. */
  dimensionMax: number
}

export const REGLE_LOGO: RegleImage = { types: ['image/png', 'image/jpeg', 'image/svg+xml'], tailleMax: 2 * 1024 * 1024, formats: 'PNG, JPG ou SVG', dimensionMax: 4000 }
export const REGLE_PHOTO: RegleImage = { types: ['image/png', 'image/jpeg', 'image/webp'], tailleMax: 5 * 1024 * 1024, formats: 'JPG, PNG ou WebP', dimensionMax: 4000 }

/** Message d'erreur à afficher, ou null si le fichier convient. */
export function validerImage(fichier: { type: string; size: number }, regle: RegleImage): string | null {
  if (!regle.types.includes(fichier.type)) return `Format non pris en charge. Choisissez une image ${regle.formats}.`
  if (fichier.size <= 0) return 'Ce fichier est vide.'
  if (fichier.size > regle.tailleMax) return `Image trop lourde : ${Math.round(regle.tailleMax / 1024 / 1024)} Mo maximum.`
  return null
}

/** Message d'erreur si l'image dépasse la limite ; 0 (SVG sans taille propre) n'est pas limité. */
export function validerDimensions({ width, height }: { width: number; height: number }, regle: RegleImage): string | null {
  return width > regle.dimensionMax || height > regle.dimensionMax
    ? `Image trop grande (${width} × ${height} px) : ${regle.dimensionMax} × ${regle.dimensionMax} px maximum.`
    : null
}

/** Dimensions naturelles ; échoue si le fichier n'est pas une image lisible. */
export function lireDimensions(fichier: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(fichier)
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Image illisible.'))
    img.src = url
  }).finally(() => URL.revokeObjectURL(url))
}

export function lireEnDataUrl(fichier: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resolve(String(lecteur.result))
    lecteur.onerror = () => reject(lecteur.error ?? new Error('Lecture du fichier impossible.'))
    lecteur.readAsDataURL(fichier)
  })
}
