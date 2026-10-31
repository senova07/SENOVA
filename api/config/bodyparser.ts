import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    convertEmptyStringsToNull: true,
    types: ['application/x-www-form-urlencoded'],
  },

  /**
   * Les chaînes vides restent des chaînes : un champ de fiche effacé par le
   * commercial n'est pas la même chose qu'un champ jamais renseigné.
   */
  json: {
    convertEmptyStringsToNull: false,
    limit: '2mb',
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  /**
   * Envoi de plusieurs photos d'un coup depuis un téléphone : les images sont
   * redimensionnées par l'interface, les documents plafonnés à 25 Mo chacun.
   */
  multipart: {
    autoProcess: true,
    convertEmptyStringsToNull: true,
    processManually: [],
    limit: '80mb',
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig
