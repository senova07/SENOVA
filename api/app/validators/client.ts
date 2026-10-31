import vine from '@vinejs/vine'
import { NATURES_CLIENT } from '#shared/clients'

const texte = (max: number) => vine.string().trim().maxLength(max).nullable().optional()
const email = () => vine.string().trim().toLowerCase().email().maxLength(254).nullable().optional()

const adresse = vine.object({
  libelle: vine.string().trim().minLength(1).maxLength(60),
  ligne1: vine.string().trim().minLength(1).maxLength(255),
  ligne2: texte(255),
  codePostal: vine.string().trim().minLength(1).maxLength(10),
  ville: vine.string().trim().minLength(1).maxLength(100),
  pays: vine
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  parDefaut: vine.boolean().optional(),
})

const contact = vine.object({
  nom: vine.string().trim().minLength(1).maxLength(150),
  role: texte(80),
  email: email(),
  telephone: texte(30),
})

/** Création et remplacement : même corps. Tags dédupliqués par le service. */
export const clientValidator = vine.create({
  nature: vine.enum(NATURES_CLIENT),
  nom: vine.string().trim().minLength(1).maxLength(150),
  prenom: texte(100),
  email: email(),
  telephone: texte(30),
  siren: vine
    .string()
    .trim()
    .regex(/^\d{9}$/)
    .nullable()
    .optional(),
  siret: vine
    .string()
    .trim()
    .regex(/^\d{14}$/)
    .nullable()
    .optional(),
  tvaIntracom: texte(20),
  notes: vine.string().trim().maxLength(5000).nullable().optional(),
  tags: vine.array(vine.string().trim().minLength(1).maxLength(40)).maxLength(30).optional(),
  adresses: vine.array(adresse).maxLength(20).optional(),
  contacts: vine.array(contact).maxLength(50).optional(),
})

export const archiverValidator = vine.create({
  motif: vine.string().trim().maxLength(255).nullable().optional(),
})

export const listeClientsValidator = vine.create({
  recherche: vine.string().trim().maxLength(100).optional(),
  archives: vine.enum(['0', '1']).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
  parPage: vine.number().withoutDecimals().min(1).max(100).optional(),
})
