import vine from '@vinejs/vine'
import { TAUX_TVA, TYPES_ARTICLE } from '#shared/articles'

export const articleValidator = vine.create({
  reference: vine.string().trim().maxLength(60).nullable().optional(),
  nom: vine.string().trim().minLength(1).maxLength(200),
  description: vine.string().trim().maxLength(5000).optional(),
  type: vine.enum(TYPES_ARTICLE),
  unite: vine.string().trim().minLength(1).maxLength(30),
  prixUnitaireHt: vine.number().min(0).max(9999999999.99),
  tauxTva: vine.number().in([...TAUX_TVA]),
  prixAchatHt: vine.number().min(0).max(9999999999.99).nullable().optional(),
  categorieId: vine.number().positive().nullable().optional(),
  favori: vine.boolean().optional(),
  actif: vine.boolean().optional(),
})

export const favoriValidator = vine.create({ favori: vine.boolean() })

export const ordreArticlesValidator = vine.create({
  ids: vine.array(vine.number().positive()).minLength(1).maxLength(5000),
})

export const categorieValidator = vine.create({
  nom: vine.string().trim().minLength(1).maxLength(80),
})
