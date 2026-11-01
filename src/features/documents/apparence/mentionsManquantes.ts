import type { MentionsLegales } from '../rendu'

export type ManqueMention = 'adresse' | keyof MentionsLegales

const REQUISES: readonly (keyof MentionsLegales)[] = ['siret', 'numeroTva', 'formeJuridique', 'assureur', 'contratAssurance', 'iban']

/**
 * Mentions obligatoires absentes, d'après ce qui s'imprime réellement sur le document :
 * les mentions du brouillon et l'adresse de l'entreprise (vide si elle est incomplète).
 */
export function mentionsManquantes(mentions: MentionsLegales, adresse: string): ManqueMention[] {
  const manques: ManqueMention[] = REQUISES.filter((cle) => !mentions[cle].trim())
  return adresse.trim() ? manques : ['adresse', ...manques]
}
