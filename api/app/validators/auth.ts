import vine from '@vinejs/vine'

const email = () => vine.string().trim().toLowerCase().email().maxLength(254)

export const inscriptionValidator = vine.create({
  nomComplet: vine.string().trim().minLength(1).maxLength(120),
  email: email(),
  motDePasse: vine.string().minLength(10).maxLength(200),
  nomOrganisation: vine.string().trim().minLength(1).maxLength(150),
})

export const connexionValidator = vine.create({
  email: email(),
  motDePasse: vine.string().minLength(1).maxLength(200),
})

export const changerOrganisationValidator = vine.create({
  organisationId: vine.string().trim().minLength(1).maxLength(20),
})
