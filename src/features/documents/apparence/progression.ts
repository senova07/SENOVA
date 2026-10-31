import type { ReglagesDocuments } from '../api'
import { MODELES_PAGE, POLICES, type ChartePage } from '../rendu'
import { avertissementsContraste } from './contraste'
import { mentionsManquantes } from './mentionsManquantes'
import { SECTIONS, type IdSection } from './sections'

export interface ElementProgression {
  id: string
  libelle: string
  ok: boolean
  section: IdSection
}

export interface Progression {
  pourcentage: number
  elements: ElementProgression[]
}

const plein = (v: string | null | undefined) => Boolean(v?.trim())
const hexOk = (c: string) => /^#[0-9a-f]{6}$/i.test(c)

/** Mentions et adresse viennent de ce qui s'imprime réellement : le brouillon (déjà prérempli) et l'adresse de l'entreprise. */
export function calculerProgression(charte: ChartePage, reglages: ReglagesDocuments, adresse: string): Progression {
  const manques = mentionsManquantes(reglages.mentions, adresse)
  const mentionsCompletes = !manques.some((m) => m !== 'iban')
  const couleursOk = hexOk(charte.couleurPrincipale) && hexOk(charte.couleurAccent) && avertissementsContraste(charte).length === 0
  const elements: ElementProgression[] = [
    { id: 'logo', libelle: 'Logo', ok: plein(charte.logo), section: SECTIONS.logo },
    { id: 'couleurs', libelle: 'Couleurs lisibles', ok: couleursOk, section: SECTIONS.logo },
    { id: 'modele', libelle: 'Modèle choisi', ok: MODELES_PAGE.some((x) => x.id === charte.modele), section: SECTIONS.modele },
    { id: 'police', libelle: 'Police définie', ok: POLICES.some((x) => x.id === charte.police), section: SECTIONS.police },
    { id: 'textes', libelle: 'Textes par défaut', ok: plein(reglages.textes.conditions) && plein(reglages.textes.remerciement), section: SECTIONS.textes },
    { id: 'mentions', libelle: 'Mentions légales', ok: mentionsCompletes, section: SECTIONS.mentions },
    { id: 'iban', libelle: 'IBAN', ok: !manques.includes('iban'), section: SECTIONS.mentions },
  ]
  return { pourcentage: Math.round((elements.filter((e) => e.ok).length / elements.length) * 100), elements }
}
