import { couleurTexteLisible, rapportContraste } from '../../../lib/couleur'
import type { ChartePage } from '../rendu'

/** Seuil WCAG AA pour du texte courant. */
export const SEUIL_AA = 4.5

export interface AvertissementContraste {
  role: 'principale' | 'accent'
  rapport: number
  message: string
}

const arrondi = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',')

/**
 * La couleur principale sert de texte sur fond blanc (titres, totaux) : on mesure son contraste avec le blanc.
 * L'accent porte du texte (bandeaux) : on mesure le texte que le document y pose réellement.
 */
export function avertissementsContraste({ couleurPrincipale, couleurAccent }: Pick<ChartePage, 'couleurPrincipale' | 'couleurAccent'>): AvertissementContraste[] {
  const mesures = [
    { role: 'principale' as const, nom: 'La couleur principale', rapport: rapportContraste(couleurPrincipale, '#FFFFFF') },
    { role: 'accent' as const, nom: 'La couleur d’accent', rapport: rapportContraste(couleurAccent, couleurTexteLisible(couleurAccent)) },
  ]
  return mesures
    .filter((m) => m.rapport < SEUIL_AA)
    .map((m) => ({
      role: m.role,
      rapport: m.rapport,
      message: `${m.nom} rend certains textes difficiles à lire (contraste ${arrondi(m.rapport)} : 1, il faut au moins ${arrondi(SEUIL_AA)} : 1). Choisissez une teinte plus foncée.`,
    }))
}
