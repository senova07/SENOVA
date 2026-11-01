import type { DetailErreur } from '@/services/http'
import type { Client, ClientSaisie, NatureClient } from '@shared/clients'

export interface LigneAdresse {
  cle: number
  libelle: string
  ligne1: string
  ligne2: string
  codePostal: string
  ville: string
  pays: string
  parDefaut: boolean
}

export interface LigneContact {
  cle: number
  nom: string
  role: string
  email: string
  telephone: string
}

export interface Brouillon {
  nature: NatureClient
  nom: string
  prenom: string
  email: string
  telephone: string
  siren: string
  siret: string
  tvaIntracom: string
  notes: string
  tags: string[]
  adresses: LigneAdresse[]
  contacts: LigneContact[]
}

export type Erreurs = Record<string, string>

const vers = (t: string) => t.trim() || null

let derniereCle = 0
const nouvelleCle = () => ++derniereCle

export function brouillonDe(client: Client | null): Brouillon {
  return {
    nature: client?.nature ?? 'particulier',
    nom: client?.nom ?? '',
    prenom: client?.prenom ?? '',
    email: client?.email ?? '',
    telephone: client?.telephone ?? '',
    siren: client?.siren ?? '',
    siret: client?.siret ?? '',
    tvaIntracom: client?.tvaIntracom ?? '',
    notes: client?.notes ?? '',
    tags: client?.tags ?? [],
    adresses: (client?.adresses ?? []).map((a) => ({
      cle: nouvelleCle(),
      libelle: a.libelle,
      ligne1: a.ligne1,
      ligne2: a.ligne2 ?? '',
      codePostal: a.codePostal,
      ville: a.ville,
      pays: a.pays,
      parDefaut: a.parDefaut,
    })),
    contacts: (client?.contacts ?? []).map((c) => ({
      cle: nouvelleCle(),
      nom: c.nom,
      role: c.role ?? '',
      email: c.email ?? '',
      telephone: c.telephone ?? '',
    })),
  }
}

export function versSaisie(b: Brouillon): ClientSaisie {
  const entreprise = b.nature === 'entreprise'
  return {
    nature: b.nature,
    nom: b.nom.trim(),
    prenom: entreprise ? null : vers(b.prenom),
    email: vers(b.email),
    telephone: vers(b.telephone),
    siren: entreprise ? vers(b.siren) : null,
    siret: entreprise ? vers(b.siret) : null,
    tvaIntracom: entreprise ? vers(b.tvaIntracom) : null,
    notes: vers(b.notes),
    tags: b.tags,
    adresses: b.adresses.map((a) => ({
      libelle: a.libelle.trim(),
      ligne1: a.ligne1.trim(),
      ligne2: vers(a.ligne2),
      codePostal: a.codePostal.trim(),
      ville: a.ville.trim(),
      pays: a.pays.trim() || 'FR',
      parDefaut: a.parDefaut,
    })),
    contacts: b.contacts.map((c) => ({
      nom: c.nom.trim(),
      role: vers(c.role),
      email: vers(c.email),
      telephone: vers(c.telephone),
    })),
  }
}

/** Seul le nom est contrôlé ici ; le reste l'est par l'API. */
export function valider(b: Brouillon): Erreurs {
  if (b.nom.trim()) return {}
  return { nom: b.nature === 'entreprise' ? 'Renseignez la raison sociale.' : 'Renseignez le nom.' }
}

/** Première erreur de l'API par champ (`adresses.0.ville`…). */
export function erreursDepuisApi(details: readonly DetailErreur[]): Erreurs {
  const parChamp: Erreurs = {}
  for (const d of details) if (d.field && !parChamp[d.field]) parChamp[d.field] = d.message
  return parChamp
}

export const adresseVide = (premiere: boolean): LigneAdresse => ({
  cle: nouvelleCle(),
  libelle: premiere ? 'Principale' : '',
  ligne1: '',
  ligne2: '',
  codePostal: '',
  ville: '',
  pays: 'FR',
  parDefaut: premiere,
})

export const contactVide = (): LigneContact => ({
  cle: nouvelleCle(),
  nom: '',
  role: '',
  email: '',
  telephone: '',
})

/** Tant qu'il reste une adresse, l'une d'elles est par défaut. */
export function sansAdresse(adresses: readonly LigneAdresse[], cle: number): LigneAdresse[] {
  const reste = adresses.filter((a) => a.cle !== cle)
  const sansDefaut = !reste.some((a) => a.parDefaut)
  return reste.map((a, i) => (sansDefaut && i === 0 ? { ...a, parDefaut: true } : a))
}

export const adresseParDefaut = (adresses: readonly LigneAdresse[], cle: number): LigneAdresse[] =>
  adresses.map((a) => ({ ...a, parDefaut: a.cle === cle }))

/** Ajoute un tag s'il est non vide et nouveau (sans tenir compte de la casse). */
export function avecTag(tags: readonly string[], saisie: string): string[] {
  const tag = saisie.trim()
  if (!tag || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return [...tags]
  return [...tags, tag]
}
