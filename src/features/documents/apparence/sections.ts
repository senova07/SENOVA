import type { ZoneDocument } from '../rendu'

/** Ancres des sections numérotées (cibles de `allerASection`). */
export const SECTIONS = {
  logo: 'apparence-logo',
  modele: 'apparence-modele',
  tableau: 'apparence-tableau',
  police: 'apparence-police',
  entete: 'apparence-entete',
  mentions: 'apparence-mentions',
  textes: 'apparence-textes',
  options: 'apparence-options',
} as const

export type IdSection = (typeof SECTIONS)[keyof typeof SECTIONS]

/** Section à ouvrir quand on clique une zone de l'aperçu. */
export const SECTION_PAR_ZONE: Record<ZoneDocument, IdSection> = {
  entete: SECTIONS.entete,
  client: SECTIONS.modele,
  informations: SECTIONS.modele,
  lignes: SECTIONS.tableau,
  totaux: SECTIONS.options,
  conditions: SECTIONS.textes,
  pied: SECTIONS.mentions,
}
