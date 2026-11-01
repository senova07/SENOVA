import { useEffect, useState } from 'react'
import { PALETTES_LOGO_PAR_DEFAUT, palettesDepuisImage } from '../../../lib/couleur'

interface Etat {
  logo: string
  palettes: string[][]
  /** L'extraction a échoué (canvas verrouillé, image illisible) : palettes par défaut proposées. */
  repli: boolean
}

/** Palettes tirées du logo : suivent `logo` (import, retrait, annulation). Sans logo ou en cas d'échec, palettes par défaut. */
export function usePalettesLogo(logo: string | undefined): { palettes: string[][]; repli: boolean } {
  const [etat, setEtat] = useState<Etat | null>(null)

  useEffect(() => {
    if (!logo) return undefined
    let annule = false
    palettesDepuisImage(logo).then(
      (palettes) => !annule && setEtat({ logo, palettes, repli: false }),
      // Un SVG ou une image « souillée » peut lever une SecurityError à getImageData.
      () => !annule && setEtat({ logo, palettes: PALETTES_LOGO_PAR_DEFAUT, repli: true }),
    )
    return () => {
      annule = true
    }
  }, [logo])

  return logo && etat?.logo === logo ? etat : { palettes: PALETTES_LOGO_PAR_DEFAUT, repli: false }
}
