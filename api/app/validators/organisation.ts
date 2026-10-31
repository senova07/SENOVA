import vine from '@vinejs/vine'

/** Un champ facultatif : absent = inchangé, `null` = effacé. */
const texte = (max: number) => vine.string().trim().maxLength(max).nullable().optional()

export const profilOrganisationValidator = vine.create({
  nom: vine.string().trim().minLength(1).maxLength(150),
  formeJuridique: texte(60),
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
  adresse: texte(255),
  codePostal: texte(10),
  ville: texte(100),
  pays: vine
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  email: vine.string().trim().toLowerCase().email().maxLength(254).nullable().optional(),
  telephone: texte(30),
})
